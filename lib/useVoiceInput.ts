"use client";

import { useEffect, useRef, useState } from "react";

export type MicState = "idle" | "recording" | "transcribing";

const BARS = 40;

/** Record from the microphone, show live levels, then turn the recording into text
 *  through /api/transcribe. `onText` receives the transcript. */
export function useVoiceInput(onText: (text: string) => void) {
  const [state, setState] = useState<MicState>("idle");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const discard = useRef(false);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  });

  // Stop the microphone if the page is left mid-recording.
  useEffect(
    () => () => {
      discard.current = true;
      if (recorder.current?.state === "recording") recorder.current.stop();
    },
    [],
  );

  async function start() {
    setError("");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("I can't reach the microphone. Allow it in the browser's address bar. / Lejo mikrofonin.");
      return;
    }

    // Live loudness, for the waveform.
    const audio = new AudioContext();
    const analyser = audio.createAnalyser();
    analyser.fftSize = 512;
    audio.createMediaStreamSource(stream).connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    let frame = 0;
    let lastTick = 0;
    const tick = (now: number) => {
      if (now - lastTick > 70) {
        lastTick = now;
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const s of samples) sum += ((s - 128) / 128) ** 2;
        const level = Math.min(1, Math.sqrt(sum / samples.length) * 5);
        setLevels((prev) => [...prev.slice(-(BARS - 1)), level]);
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
      if (discard.current) return setState("idle");

      setState("transcribing");
      try {
        const form = new FormData();
        form.append("audio", new Blob(chunks, { type: rec.mimeType }), "voice.webm");
        const res = await fetch("/api/transcribe", { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());
        const { text } = await res.json();
        if (text) onTextRef.current(text);
        else setError("I didn't catch that. Try again? / S'e kapa. Provo përsëri?");
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : "Couldn't use the recording.");
      } finally {
        setState("idle");
      }
    };

    rec.start();
    setState("recording");
  }

  function toggle() {
    if (state === "recording") recorder.current?.stop();
    else if (state === "idle") start();
  }

  /** Stop recording and throw the audio away. */
  function cancel() {
    if (state !== "recording") return;
    discard.current = true;
    recorder.current?.stop();
  }

  return { state, error, seconds, levels, toggle, cancel };
}

export const formatSeconds = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
