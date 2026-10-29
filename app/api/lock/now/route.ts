import { cookies } from "next/headers";
import { UNLOCK_COOKIE } from "@/lib/appLock";

// "Lock now": forget that Mind was unlocked, so the PIN is needed again.
export async function POST() {
  (await cookies()).delete(UNLOCK_COOKIE);
  return new Response(null, { status: 204 });
}
