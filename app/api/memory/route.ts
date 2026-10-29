import { fillForYou, listSummaries } from "@/lib/memory";
import { accountsOnly, isGuest, serverClient, unauthorized } from "@/lib/supabase/server";

export async function GET() {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  if (isGuest(user)) return accountsOnly();
  // Older notes get their "to you" version the first time they're shown.
  return Response.json({ summaries: await fillForYou(supabase, await listSummaries(supabase)) });
}
