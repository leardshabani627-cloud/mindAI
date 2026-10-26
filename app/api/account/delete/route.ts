import { deleteAllData } from "@/lib/memory";
import { serverClient, unauthorized } from "@/lib/supabase/server";

// Erases every message, summary, mood entry and setting belonging to the signed-in user.
// (The login itself stays; remove it in the Supabase dashboard under Authentication > Users.)
export async function POST() {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  return new Response(null, { status: (await deleteAllData(supabase, user.id)) ? 204 : 500 });
}
