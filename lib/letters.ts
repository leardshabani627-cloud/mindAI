import type { SupabaseClient } from "@supabase/supabase-js";
import { complete, llmConfig } from "@/lib/llm";
import { moodTag } from "@/lib/moodTags";
import { guessLanguage } from "@/lib/voice";
import { getCompanion } from "@/prompts/companions";
import { letterPrompt } from "@/prompts/letter";

// Server only. Weekly letters look back on one Monday-to-Sunday week.
// They are written from mood check-ins and conversation summaries only; the journal is never used.
// The signed-in user's client is used, so Row Level Security limits everything to their own rows.

export type Letter = { id: string; week_start: string; companion: string; body: string; created_at: string };

const COLUMNS = "id, week_start, companion, body, created_at";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const addDays = (date: string, days: number) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

/** A week start must be a Monday that isn't in the future. */
export function isValidWeekStart(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_RE.test(value)) return false;
  const day = new Date(`${value}T12:00:00Z`);
  return !isNaN(day.getTime()) && day.getUTCDay() === 1 && value <= addDays(new Date().toISOString().slice(0, 10), 1);
}

/** Newest first. */
export async function listLetters(supabase: SupabaseClient): Promise<Letter[]> {
  const { data, error } = await supabase.from("weekly_letters").select(COLUMNS).order("week_start", { ascending: false });
  if (error) console.error("listLetters failed:", error.message);
  return data ?? [];
}

export async function deleteLetter(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { error, count } = await supabase.from("weekly_letters").delete({ count: "exact" }).eq("id", id);
  if (error) console.error("deleteLetter failed:", error.message);
  return !error && (count ?? 0) > 0;
}

export type LetterResult = { letter: Letter } | { empty: true } | { failed: true };

/** Returns the letter for that week, writing it first if needed. */
export async function getOrWriteLetter(
  supabase: SupabaseClient,
  userId: string,
  weekStart: string,
  companionId: unknown,
  appLang: "en" | "sq" = "en", // the app's language: used when their own words don't show one clearly
): Promise<LetterResult> {
  const { data: existing } = await supabase.from("weekly_letters").select(COLUMNS).eq("week_start", weekStart).maybeSingle();
  if (existing) return { letter: existing };
  if (!llmConfig()) return { failed: true };

  const weekEnd = addDays(weekStart, 6);
  const [{ data: moods }, { data: summaries }, { data: settings }] = await Promise.all([
    supabase
      .from("mood_entries")
      .select("entry_date, mood, note, tags")
      .gte("entry_date", weekStart)
      .lte("entry_date", weekEnd)
      .order("entry_date", { ascending: true }),
    supabase
      .from("session_summaries")
      .select("summary, themes, created_at")
      .gte("created_at", `${weekStart}T00:00:00Z`)
      .lt("created_at", `${addDays(weekStart, 7)}T00:00:00Z`)
      .order("created_at", { ascending: true }),
    supabase.from("user_settings").select("display_name").maybeSingle(),
  ]);

  if (!moods?.length && !summaries?.length) return { empty: true }; // nothing to look back on

  const weekday = (date: string) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  const moodLines = (moods ?? []).map(
    (m) =>
      `- ${weekday(m.entry_date)}: ${m.mood}/10` +
      (m.tags?.length ? ` [affected by: ${m.tags.map((t: string) => moodTag(t)?.en ?? t).join(", ")}]` : "") +
      (m.note ? ` - "${m.note}"` : ""),
  );
  const summaryLines = (summaries ?? []).map(
    (s) => `- ${s.summary}${s.themes?.length ? ` [themes: ${s.themes.join(", ")}]` : ""}`,
  );
  // Write in the language their own words are mostly in (the labels above are always English);
  // if it's a tie (or there are no words), in the language they use the app in.
  const ownWords = [...(moods ?? []).map((m) => m.note), ...(summaries ?? []).map((s) => s.summary)].filter(Boolean);
  const albanian = ownWords.filter((t) => guessLanguage(t) === "sq").length;
  const english = ownWords.length - albanian;
  const sq = albanian > english || (albanian === english && appLang === "sq");
  const language = sq ? "Albanian (shqip)" : "English";

  const input = [
    `Write this letter in ${language}.`,
    `Week: ${weekStart} to ${weekEnd}.`,
    `Mood check-ins (1 = very low, 10 = very good):\n${moodLines.join("\n") || "(none this week)"}`,
    `Notes from our conversations this week:\n${summaryLines.join("\n") || "(none this week)"}`,
  ].join("\n\n");

  const companion = getCompanion(companionId);
  try {
    const body = (await complete(letterPrompt(companion, settings?.display_name), input)).trim();
    if (!body) return { failed: true };

    // ignoreDuplicates: if two tabs ask at once, the first letter wins and the second is dropped.
    await supabase
      .from("weekly_letters")
      .upsert({ user_id: userId, week_start: weekStart, companion: companion.id, body }, { onConflict: "user_id,week_start", ignoreDuplicates: true });
    const { data: saved } = await supabase.from("weekly_letters").select(COLUMNS).eq("week_start", weekStart).maybeSingle();
    return saved ? { letter: saved } : { failed: true };
  } catch (err) {
    console.error("getOrWriteLetter failed:", err);
    return { failed: true };
  }
}
