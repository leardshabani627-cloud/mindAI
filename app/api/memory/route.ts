import { listSummaries } from "@/lib/memory";
import { accountsOnly, isGuest, serverClient, unauthorized } from "@/lib/supabase/server";

export async function GET() {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  if (isGuest(user)) return accountsOnly();
  return Response.json({ summaries: await listSummaries(supabase) });
}
