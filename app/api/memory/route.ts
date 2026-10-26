import { listSummaries } from "@/lib/memory";
import { serverClient, unauthorized } from "@/lib/supabase/server";

export async function GET() {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  return Response.json({ summaries: await listSummaries(supabase) });
}
