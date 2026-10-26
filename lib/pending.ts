// Set when the home screen's mic is pressed, so the chat opens already listening.
// Kept in sessionStorage, never the URL.
const VOICE_KEY = "mind-start-voice";

export function setStartVoice() {
  try {
    sessionStorage.setItem(VOICE_KEY, "1");
  } catch {}
}

export function takeStartVoice(): boolean {
  try {
    const on = sessionStorage.getItem(VOICE_KEY) === "1";
    sessionStorage.removeItem(VOICE_KEY);
    return on;
  } catch {
    return false;
  }
}
