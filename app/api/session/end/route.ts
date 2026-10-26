import { summarizeSession } from "@/lib/memory";
import { serverClient, unauthorized } from "@/lib/supabase/server";

export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Called when a session ends (new conversation or 20 minutes of inactivity).
export async function POST(req: Request) {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();

  const { sessionId } = await req.json().catch(() => ({}));
  if (typeof sessionId !== "string" || !UUID.test(sessionId)) {
    return new Response("Invalid request.", { status: 400 });
  }
  await summarizeSession(supabase, user.id, sessionId);
  return new Response(null, { status: 204 });
}
