import { deleteAllData } from "@/lib/memory";
import { serverClient, unauthorized } from "@/lib/supabase/server";

// Erases every message, summary, mood entry and setting belonging to the signed-in user.
// (The login itself stays; remove it in the Supabase dashboard under Authentication > Users.)
export async function POST() {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  const ok = await deleteAllData(supabase, user.id);
  // The app lock goes too: the PIN, and the "lock is on" flag.
  await supabase.rpc("clear_app_lock");
  await supabase.auth.updateUser({ data: { app_lock: false } });
  return new Response(null, { status: ok ? 204 : 500 });
}
