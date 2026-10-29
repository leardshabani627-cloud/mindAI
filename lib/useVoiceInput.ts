"use client";

import { useEffect, useRef, useState } from "react";
import { useCopy } from "@/lib/i18n";

const en = {
  noMic: "I can't reach the microphone. Allow it in the browser's address bar.",
  notCaught: "I didn't catch that. Try again?",
  failed: "Couldn't use the recording. Please try again.",
};
const COPY = {
  en,
  sq: {
    noMic: "Nuk e arrij mikrofonin. Lejoje te shiriti i adresës së shfletuesit.",
    notCaught: "S'e kapa mirë. Provo përsëri?",
    failed: "Regjistrimi nuk u përdor dot. Provo përsëri.",
  } satisfies typeof en,
};

export type MicState = "idle" | "recording" | "transcribing";

const BARS = 40;
const SPEECH_LEVEL = 0.12; // louder than this counts as talking
const SPEECH_TICKS = 4; // ...for about a third of a second, so a click or a breath doesn't count
const PAUSE_MS = 1400; // in live talk, this much quiet after talking ends the turn
const QUIET_LIMIT_MS = 45_000; // in live talk, listening this long without a word starts over

/** Record from the microphone, show live levels, then turn the recording into text
 *  through /api/transcribe. `onText` receives the transcript.
 *  When `autoStop()` is true (live talk), recording ends by itself once you pause. */
export function useVoiceInput(onText: (text: string) => void, { autoStop = () => false }: { autoStop?: () => boolean } = {}) {
  const t = useCopy(COPY);
  const [state, setState] = useState<MicState>("idle");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const [micBlocked, setMicBlocked] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stateRef = useRef<MicState>("idle");
  const autoStopRef = useRef(autoStop);
  const discard = useRef(false);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
    autoStopRef.current = autoStop;
  });

  function changeState(next: MicState) {
    stateRef.current = next;
    setState(next);
  }

  // Stop the microphone if the page is left mid-recording.
  useEffect(
    () => () => {
      discard.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
    },
    [],
  );

  async function start() {
    if (stateRef.current !== "idle") return;
    changeState("recording"); // claimed now, so a second call can't open the mic twice
    setError("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError(t.noMic);
      setMicBlocked(true);
      changeState("idle");
      return;
    }
    setMicBlocked(false);

    // Live loudness, for the waveform.
    const audio = new AudioContext();
    const analyser = audio.createAnalyser();
    analyser.fftSize = 512;
    audio.createMediaStreamSource(stream).connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    let frame = 0;
    let lastTick = 0;
    let heardSpeech = false;
    let loudTicks = 0;
    let lastLoud = performance.now();
    const listenedFrom = performance.now();
    const tick = (now: number) => {
      if (now - lastTick > 70) {
        lastTick = now;
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const s of samples) sum += ((s - 128) / 128) ** 2;
        const level = Math.min(1, Math.sqrt(sum / samples.length) * 5);
        setLevels((prev) => [...prev.slice(-(BARS - 1)), level]);

        // Live talk: a pause after speaking ends the turn, like in a real conversation.
        if (level > SPEECH_LEVEL) {
          loudTicks += 1;
          lastLoud = now;
          if (loudTicks >= SPEECH_TICKS) heardSpeech = true;
        }
        if (autoStopRef.current() && rec.state === "recording") {
          if (heardSpeech && now - lastLoud > PAUSE_MS) rec.stop();
          else if (!heardSpeech && now - listenedFrom > QUIET_LIMIT_MS) {
            discard.current = true;
            rec.stop();
          }
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    const startedAt = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 250);

    const chunks: Blob[] = [];
    const rec = new MediaRecorder(stream);
    recorder.current = rec;
    discard.current = false;

    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.onstop = async () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
      audio.close().catch(() => {});
      stream.getTracks().forEach((t) => t.stop()); // turns the microphone light off
      setLevels([]);
      setSeconds(0);
      if (discard.current) return changeState("idle");

      changeState("transcribing");
      try {
        const form = new FormData();
        form.append("audio", new Blob(chunks, { type: rec.mimeType }), "voice.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());
        const { text } = await res.json();
        if (text) onTextRef.current(text);
        else setError(t.notCaught);
      } catch {
        setError(t.failed);
      } finally {
        changeState("idle");
      }
    };

    rec.start();
  }

  function toggle() {
    if (stateRef.current === "recording") recorder.current?.stop();
    else if (stateRef.current === "idle") start();
  }

  /** Stop recording and throw the audio away. */
  function cancel() {
    if (stateRef.current !== "recording") return;
    discard.current = true;
    recorder.current?.stop();
  }

  return { state, error, seconds, levels, micBlocked, toggle, listen: start, cancel };
}

export const formatSeconds = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
