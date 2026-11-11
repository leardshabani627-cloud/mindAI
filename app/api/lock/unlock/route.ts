import { cookies } from "next/headers";
import { UNLOCK_COOKIE, lockSettings, unlockCookieOptions, unlockToken } from "@/lib/appLock";
import { serverClient, unauthorized } from "@/lib/supabase/server";

// Checks the 4-digit PIN (in the database, which also limits wrong tries) and unlocks Mind.
export async function POST(req: Request) {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();

  const { pin } = await req.json().catch(() => ({}));
  if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) return Response.json({ result: "wrong" }, { status: 400 });

  const { data, error } = await supabase.rpc("check_app_lock", { pin });
  if (error) {
    console.error("check_app_lock failed:", error.message);
    return Response.json({ result: "error" }, { status: 500 });
  }
  if (data === "wrong") return Response.json({ result: "wrong" }, { status: 401 });
  if (data === "wait") return Response.json({ result: "wait" }, { status: 429 });

  // "ok" (or no lock at all): unlocked for the chosen number of idle minutes.
  (await cookies()).set(UNLOCK_COOKIE, await unlockToken(user.id, lockSettings(user).minutes), unlockCookieOptions);
  return Response.json({ result: "ok" });
}
