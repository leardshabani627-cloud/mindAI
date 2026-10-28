import { getOrWriteLetter, isValidWeekStart, listLetters } from "@/lib/letters";
import { accountsOnly, isGuest, serverClient, unauthorized } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function GET() {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  if (isGuest(user)) return accountsOnly();
  return Response.json({ letters: await listLetters(supabase) });
}

// Body: { weekStart: "YYYY-MM-DD" (a Monday, in your local calendar), companion: "ela" | ... }
// Returns { letter } (existing or newly written), { empty: true } when there's nothing to look back on,
// or 502 when it couldn't be written right now.
export async function POST(req: Request) {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  if (isGuest(user)) return accountsOnly();

  const { weekStart, companion, lang } = await req.json().catch(() => ({}));
  if (!isValidWeekStart(weekStart)) return new Response("Invalid week.", { status: 400 });

  const result = await getOrWriteLetter(supabase, user.id, weekStart, companion, lang === "sq" ? "sq" : "en");
  return Response.json(result, { status: "failed" in result ? 502 : 200 });
}
