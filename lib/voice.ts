// Browser-only voice helpers: speaking replies aloud with the voices installed on the device.

/** Rough guess: Albanian or English. Good enough to choose a voice. */
export function guessLanguage(text: string): "sq" | "en" {
  return /[ëç]|\b(dhe|unë|është|jam|që|për|një|të|nuk|po|mirë|faleminderit)\b/i.test(text) ? "sq" : "en";
}

export function stopSpeaking() {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel();
}

/** Speaks the text. Returns false if the device has no voice for that language
 *  (better to stay silent than to read Albanian with an English accent). */
export function speak(text: string): boolean {
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
  synth.speak(utterance);
  return true;
}
