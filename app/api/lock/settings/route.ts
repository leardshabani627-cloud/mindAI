import { cookies } from "next/headers";
import { LOCK_MINUTES, UNLOCK_COOKIE, lockConfigured, lockSettings, unlockCookieOptions, unlockToken } from "@/lib/appLock";
import { accountsOnly, isGuest, serverClient, unauthorized } from "@/lib/supabase/server";

// Is the app lock on, and after how many idle minutes does it lock again?
// (Only reachable while unlocked: the proxy answers 423 otherwise.)
export async function GET() {
  const { user } = await serverClient();
  if (!user) return unauthorized();
  return Response.json({ ...lockSettings(user), available: lockConfigured() && !isGuest(user) });
}

// Body: { pin } to turn the lock on or change the PIN, { minutes } to change the timing, { enabled: false } to turn it off.
export async function POST(req: Request) {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  if (isGuest(user)) return accountsOnly();
  if (!lockConfigured()) return new Response("The app lock isn't set up on the server (APP_LOCK_SECRET).", { status: 500 });

  const body = await req.json().catch(() => ({}));
  const jar = await cookies();
  const current = lockSettings(user);

  if (body.enabled === false) {
    const { error } = await supabase.rpc("clear_app_lock");
    if (error) return new Response("Couldn't turn the lock off.", { status: 500 });
    await supabase.auth.updateUser({ data: { app_lock: false } });
    jar.delete(UNLOCK_COOKIE);
    return Response.json({ enabled: false, minutes: current.minutes });
  }

  const minutes = body.minutes === undefined ? current.minutes : Number(body.minutes);
  if (!LOCK_MINUTES.includes(minutes)) return new Response("Invalid request.", { status: 400 });

  if (body.pin !== undefined) {
    if (typeof body.pin !== "string" || !/^\d{4}$/.test(body.pin)) return new Response("Invalid request.", { status: 400 });
    const { error } = await supabase.rpc("set_app_lock", { pin: body.pin });
    if (error) {
      console.error("set_app_lock failed:", error.message);
      return new Response("Couldn't save the PIN.", { status: 500 });
    }
  } else if (!current.enabled) {
    return new Response("Choose a PIN first.", { status: 400 });
  }

  const { error } = await supabase.auth.updateUser({ data: { app_lock: true, app_lock_minutes: minutes } });
  if (error) return new Response("Couldn't save.", { status: 500 });
  // Setting it up shouldn't lock you out straight away.
  jar.set(UNLOCK_COOKIE, await unlockToken(user.id, minutes), unlockCookieOptions);
  return Response.json({ enabled: true, minutes });
}
