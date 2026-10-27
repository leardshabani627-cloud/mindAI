import type { SupabaseClient } from "@supabase/supabase-js";

// Server only. Uses the signed-in user's client, so RLS limits it to their own entries.

export type MoodEntry = { entry_date: string; mood: number; note: string; tags: string[] };

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Oldest first. */
export async function listMood(supabase: SupabaseClient, days: number): Promise<MoodEntry[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("mood_entries")
    .select("entry_date, mood, note, tags")
    .gte("entry_date", since)
    .order("entry_date", { ascending: true });
  if (error) console.error("listMood failed:", error.message);
  return data ?? [];
}

/** One entry per day: saving again on the same day replaces it. */
export async function saveMood(supabase: SupabaseClient, userId: string, entry: MoodEntry): Promise<boolean> {
  const { error } = await supabase
    .from("mood_entries")
    .upsert({ user_id: userId, ...entry }, { onConflict: "user_id,entry_date" });
  if (error) console.error("saveMood failed:", error.message);
  return !error;
}
