import type { User } from "@supabase/supabase-js";

// Server only (the proxy and the /api/lock routes). The optional 4-digit app lock:
// - the PIN itself is checked in the database (see the app_lock migration);
// - whether the lock is on, and after how long it locks again, lives in the user's metadata;
// - "unlocked" is a signed cookie that runs out after that many minutes without activity.

export const UNLOCK_COOKIE = "mind-unlocked";
export const LOCK_MINUTES = [1, 5, 15, 60];
export const DEFAULT_LOCK_MINUTES = 5;
const FRESH_SIGN_IN_MS = 2 * 60 * 1000; // a password or Google sign-in this recent counts as unlocking

export const unlockCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

/** Is the lock on for this person, and after how many idle minutes does it lock again? */
export function lockSettings(user: User | null) {
  const meta = user?.user_metadata ?? {};
  const minutes = LOCK_MINUTES.includes(meta.app_lock_minutes) ? (meta.app_lock_minutes as number) : DEFAULT_LOCK_MINUTES;
  return { enabled: meta.app_lock === true && user?.is_anonymous !== true, minutes };
}

/** Signed in with a password or Google just now: that's stronger than a PIN, so no need to ask for it. */
export function justSignedIn(user: User) {
  const at = user.last_sign_in_at ? Date.parse(user.last_sign_in_at) : 0;
  return Date.now() - at < FRESH_SIGN_IN_MS;
}

const secret = () => process.env.APP_LOCK_SECRET ?? "";
export const lockConfigured = () => secret().length >= 16;

async function sign(text: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(text)));
  return btoa(String.fromCharCode(...sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A cookie value saying "this person unlocked Mind", valid for the next `minutes`. */
export async function unlockToken(userId: string, minutes: number) {
  const body = `${userId}.${Date.now() + minutes * 60_000}`;
  return `${body}.${await sign(body)}`;
}

/** True if the cookie was signed by us, belongs to this person and hasn't run out. */
export async function isUnlocked(token: string | undefined, userId: string) {
  if (!token) return false;
  const [id, exp, sig] = token.split(".");
  if (id !== userId || !exp || !sig || Number(exp) < Date.now()) return false;
  const expected = await sign(`${id}.${exp}`);
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
