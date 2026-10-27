import type { SupabaseClient } from "@supabase/supabase-js";
import { isJournalTag, type JournalTag } from "@/lib/journalTags";

// Server only. Journal entries are private writing: they are never sent to the AI.
// The signed-in user's client is used, so Row Level Security limits everything to their own entries.

export type JournalEntry = {
  id: string;
  title: string;
  body: string;
  tag: JournalTag;
  created_at: string;
  updated_at: string;
};

const MAX_TITLE = 120;
const MAX_BODY = 10_000;

/** Validates { title, body, tag } from a request. Returns null if it's not usable. */
export function cleanEntry(value: unknown): { title: string; body: string; tag: JournalTag } | null {
  if (!value || typeof value !== "object") return null;
  const { title = "", body = "", tag = "free" } = value as Record<string, unknown>;
  if (typeof title !== "string" || typeof body !== "string" || !isJournalTag(tag)) return null;
  if (title.length > MAX_TITLE || body.length > MAX_BODY) return null;
  if (!title.trim() && !body.trim()) return null;
  return { title: title.trim(), body: body.trim(), tag };
}

/** Newest first. */
export async function listEntries(supabase: SupabaseClient): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, title, body, tag, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) console.error("listEntries failed:", error.message);
  return data ?? [];
}

export async function createEntry(supabase: SupabaseClient, userId: string, entry: { title: string; body: string; tag: JournalTag }) {
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({ user_id: userId, ...entry })
    .select("id, title, body, tag, created_at, updated_at")
    .single();
  if (error) console.error("createEntry failed:", error.message);
  return data as JournalEntry | null;
}

export async function updateEntry(supabase: SupabaseClient, id: string, entry: { title: string; body: string; tag: JournalTag }) {
  const { data, error } = await supabase
    .from("journal_entries")
    .update({ ...entry, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, title, body, tag, created_at, updated_at")
    .maybeSingle();
  if (error) console.error("updateEntry failed:", error.message);
  return data as JournalEntry | null;
}

export async function deleteEntry(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { error, count } = await supabase.from("journal_entries").delete({ count: "exact" }).eq("id", id);
  if (error) console.error("deleteEntry failed:", error.message);
  return !error && (count ?? 0) > 0;
}
