// Browser-only voice helpers: speaking replies aloud.
// English replies use a natural voice from the server (/api/speak); Albanian, or anything the
// natural voice can't do right now, falls back to the voices installed on the device.

/** Rough guess: Albanian or English. Good enough to choose a voice. */
export function guessLanguage(text: string): "sq" | "en" {
  return /[ëç]|\b(dhe|unë|është|jam|që|për|një|të|nuk|po|mirë|faleminderit)\b/i.test(text) ? "sq" : "en";
}

// The natural voice playing right now, so it can be stopped.
let current: { cancelled: boolean; audio?: HTMLAudioElement } | null = null;

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
  if (current) {
    current.cancelled = true;
    current.audio?.pause();
    current = null;
  }
}

/**
 * Speaks the text. `voice` is the companion's natural English voice.
 * Returns false only if nothing can speak it (no natural voice for the language and no device voice):
 * better to stay silent than to read Albanian with an English accent.
 * `onEnd` runs once when it has finished; not when it was stopped on purpose.
 */
export function speak(text: string, onEnd?: () => void, voice?: string): boolean {
  if (typeof window === "undefined") return false;
  if (voice && guessLanguage(text) === "en") {
    stopSpeaking();
    speakNaturally(text, voice, onEnd);
    return true;
  }
  return speakWithDevice(text, onEnd);
}

/** Sentence-sized pieces (two short sentences at most), so the first one can start playing quickly. */
function pieces(text: string) {
  const sentences = text.replace(/\s+/g, " ").trim().match(/[^.!?…]+[.!?…]*["')\]]*\s*/g) ?? [text];
  const out: string[] = [];
  for (const s of sentences) {
    const last = out[out.length - 1];
    if (last && out.length > 1 && (last + s).length <= 220) out[out.length - 1] = last + s;
    else out.push(s.length > 380 ? s.slice(0, 380) : s);
  }
  return out.map((p) => p.trim()).filter(Boolean);
}

async function speakNaturally(text: string, voice: string, onEnd?: () => void) {
  const session: { cancelled: boolean; audio?: HTMLAudioElement } = { cancelled: false };
  current = session;
  let finished = false;
  const finish = () => {
    if (finished || session.cancelled) return;
    finished = true;
    if (current === session) current = null;
    onEnd?.();
  };

  const parts = pieces(text);
  const fetchPart = (part: string) =>
    fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: part, voice }),
    }).then((r) => (r.ok ? r.blob() : Promise.reject(r.status)));

  let next = fetchPart(parts[0]);
  for (let i = 0; i < parts.length; i++) {
    let audio: Blob;
    try {
      audio = await next;
    } catch {
      // The natural voice isn't available right now: read the rest with the device's voice.
      if (session.cancelled) return;
      if (current === session) current = null;
      if (!speakWithDevice(parts.slice(i).join(" "), finish)) finish();
      return;
    }
    if (session.cancelled) return;
    if (i + 1 < parts.length) next = fetchPart(parts[i + 1]); // get the next sentence ready while this one plays
    await play(audio, session);
    if (session.cancelled) return;
  }
  finish();
}

function play(blob: Blob, session: { cancelled: boolean; audio?: HTMLAudioElement }) {
  return new Promise<void>((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    session.audio = audio;
    const done = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.onpause = () => session.cancelled && done();
    audio.play().catch(done);
  });
}

function speakWithDevice(text: string, onEnd?: () => void): boolean {
  const synth = window.speechSynthesis;
  if (!synth) return false;

  const lang = guessLanguage(text);
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
  if (!voice) return false;

  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.lang = voice.lang;
  utterance.rate = 0.95;
  if (onEnd) {
    // Some browsers skip the "end" event, so also watch for the voice going quiet.
    let done = false;
    let watch: ReturnType<typeof setInterval> | undefined;
    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(watch);
      onEnd();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    utterance.onstart = () => {
      watch = setInterval(() => {
        if (!synth.speaking && !synth.pending) finish();
      }, 400);
    };
    // If it never starts at all, don't wait forever.
    setTimeout(() => {
      if (!synth.speaking && !synth.pending) finish();
    }, 3000);
  }
  synth.speak(utterance);
  return true;
}
