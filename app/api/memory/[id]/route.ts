import { deleteSummary } from "@/lib/memory";
import { accountsOnly, isGuest, serverClient, unauthorized } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  if (isGuest(user)) return accountsOnly();

  const { id } = await params;
  if (!UUID.test(id)) return new Response("Invalid id.", { status: 400 });
  return new Response(null, { status: (await deleteSummary(supabase, id)) ? 204 : 404 });
}
