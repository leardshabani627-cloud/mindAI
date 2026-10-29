// Browser-only voice helpers: speaking replies aloud with the voices installed on the device.

/** Rough guess: Albanian or English. Good enough to choose a voice. */
export function guessLanguage(text: string): "sq" | "en" {
  return /[ëç]|\b(dhe|unë|është|jam|që|për|një|të|nuk|po|mirë|faleminderit)\b/i.test(text) ? "sq" : "en";
}

export function stopSpeaking() {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

/** Speaks the text. Returns false if the device has no voice for that language
 *  (better to stay silent than to read Albanian with an English accent).
 *  `onEnd` runs once when it has finished (or was stopped). */
export function speak(text: string, onEnd?: () => void): boolean {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
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
