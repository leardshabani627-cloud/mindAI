import { cleanEntry, createEntry, listEntries } from "@/lib/journal";
import { serverClient, unauthorized } from "@/lib/supabase/server";

export async function GET() {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  return Response.json({ entries: await listEntries(supabase) });
}

export async function POST(req: Request) {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();

  const entry = cleanEntry(await req.json().catch(() => null));
  if (!entry) return new Response("Invalid entry.", { status: 400 });

  const saved = await createEntry(supabase, user.id, entry);
  return saved ? Response.json(saved, { status: 201 }) : new Response("Couldn't save.", { status: 500 });
}
