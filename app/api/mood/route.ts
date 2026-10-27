import { DATE_RE, listMood, saveMood } from "@/lib/mood";
import { cleanMoodTags } from "@/lib/moodTags";
import { serverClient, unauthorized } from "@/lib/supabase/server";

export async function GET() {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  return Response.json({ entries: await listMood(supabase, 30) });
}

export async function POST(req: Request) {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();

  const { date, mood, note, tags } = await req.json().catch(() => ({}));
  const cleanTags = cleanMoodTags(tags); // what's affecting the day, e.g. ["sleep", "work"]
  const valid =
    typeof date === "string" &&
    DATE_RE.test(date) &&
    Number.isInteger(mood) &&
    mood >= 1 &&
    mood <= 10 &&
    (note === undefined || (typeof note === "string" && note.length <= 200));
  if (!valid || !cleanTags) return new Response("Invalid request.", { status: 400 });

  const ok = await saveMood(supabase, user.id, { entry_date: date, mood, note: (note ?? "").trim(), tags: cleanTags });
  return new Response(null, { status: ok ? 204 : 500 });
}
