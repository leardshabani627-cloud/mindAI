// How the home screen hands something to the chat as it opens: start listening, start live talk,
// or send a message typed on the home screen. Kept in sessionStorage, never the URL.
const VOICE_KEY = "mind-start-voice";
const LIVE_KEY = "mind-start-live";
const TEXT_KEY = "mind-start-text";

function take(key: string) {
  try {
    const value = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    return value;
  } catch {
    return null;
  }
}

function put(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
}

/** The chat opens already listening. */
export const setStartVoice = () => put(VOICE_KEY, "1");
export const takeStartVoice = () => take(VOICE_KEY) === "1";

/** The chat opens in hands-free live talk. */
export const setStartLive = () => put(LIVE_KEY, "1");
export const takeStartLive = () => take(LIVE_KEY) === "1";

/** The chat opens and sends this message. */
export const setStartText = (text: string) => put(TEXT_KEY, text);
export const takeStartText = () => take(TEXT_KEY)?.trim() || "";
