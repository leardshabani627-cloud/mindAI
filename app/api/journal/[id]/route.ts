import { cleanEntry, deleteEntry, updateEntry } from "@/lib/journal";
import { serverClient, unauthorized } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();

  const { id } = await params;
  const entry = cleanEntry(await req.json().catch(() => null));
  if (!UUID.test(id) || !entry) return new Response("Invalid entry.", { status: 400 });

  const saved = await updateEntry(supabase, id, entry);
  return saved ? Response.json(saved) : new Response("Not found.", { status: 404 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();

  const { id } = await params;
  if (!UUID.test(id)) return new Response("Invalid id.", { status: 400 });
  return new Response(null, { status: (await deleteEntry(supabase, id)) ? 204 : 404 });
}
