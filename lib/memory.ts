import type { SupabaseClient } from "@supabase/supabase-js";
import { complete, llmConfig } from "@/lib/llm";
import { SUMMARY_PROMPT } from "@/prompts/summary";

// Server only. Every function takes the signed-in user's Supabase client
// (see lib/supabase/server.ts), so Row Level Security limits it to that user's rows.

export type Summary = {
  id: string;
  session_id: string;
  summary: string;
  themes: string[];
  created_at: string;
};

export const MIN_USER_MESSAGES = 2; // keep in sync with stale_sessions() in the SQL migration
export const IDLE_MINUTES = 20;
const MAX_TRANSCRIPT_MESSAGES = 200;

export async function saveMessage(supabase: SupabaseClient, sessionId: string, role: "user" | "assistant", content: string) {
  const { error } = await supabase.from("messages").insert({ session_id: sessionId, role, content });
  if (error) console.error("saveMessage failed:", error.message);
}

/** Newest first. */
export async function listSummaries(supabase: SupabaseClient, limit?: number): Promise<Summary[]> {
  let query = supabase.from("session_summaries").select("*").order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) console.error("listSummaries failed:", error.message);
  return data ?? [];
}

/** Deleting a summary also deletes that session's raw messages, so it is really forgotten
 *  (and the session is not summarized again later). */
export async function deleteSummary(supabase: SupabaseClient, id: string): Promise<boolean> {
  const { data } = await supabase.from("session_summaries").select("session_id").eq("id", id).maybeSingle();
  if (!data) return false;
  await supabase.from("messages").delete().eq("session_id", data.session_id);
  const { error } = await supabase.from("session_summaries").delete().eq("id", id);
  if (error) console.error("deleteSummary failed:", error.message);
  return !error;
}

/** Erase everything this user has stored. */
export async function deleteAllData(supabase: SupabaseClient, userId: string): Promise<boolean> {
  let ok = true;
  for (const table of ["messages", "session_summaries", "mood_entries", "journal_entries", "user_settings"]) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId);
    if (error) {
      ok = false;
      console.error(`deleteAllData failed on ${table}:`, error.message);
    }
  }
  return ok;
}

function parseSummary(text: string): { summary: string; themes: string[] } {
  try {
    const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "");
    if (typeof json.summary === "string" && json.summary.trim()) {
      const themes = Array.isArray(json.themes) ? json.themes.filter((t: unknown) => typeof t === "string") : [];
      return { summary: json.summary.trim(), themes: themes.slice(0, 4) };
    }
  } catch {}
  return { summary: text.trim(), themes: [] }; // model ignored the JSON format: keep the text anyway
}

export type SummaryResult = "saved" | "already-saved" | "too-short" | "failed";

/** Summarize one session and save the result. Safe to call more than once. */
export async function summarizeSession(supabase: SupabaseClient, userId: string, sessionId: string): Promise<SummaryResult> {
  if (!llmConfig()) return "failed";

  try {
    const { data: existing } = await supabase
      .from("session_summaries")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (existing) return "already-saved";

    const { data: messages } = await supabase
      .from("messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })
      .limit(MAX_TRANSCRIPT_MESSAGES);

    if (!messages || messages.filter((m) => m.role === "user").length < MIN_USER_MESSAGES) return "too-short";

    const transcript = messages.map((m) => `${m.role === "user" ? "User" : "Mind"}: ${m.content}`).join("\n\n");
    const { summary, themes } = parseSummary(await complete(SUMMARY_PROMPT, transcript));
    if (!summary) return "failed";

    // ignoreDuplicates: if two triggers race, the second insert is simply dropped.
    const { error } = await supabase
      .from("session_summaries")
      .upsert({ user_id: userId, session_id: sessionId, summary, themes }, { onConflict: "session_id", ignoreDuplicates: true });
    if (error) throw error;
    return "saved";
  } catch (err) {
    console.error("summarizeSession failed:", err);
    return "failed";
  }
}

/** Catch sessions that were never ended explicitly (tab closed, computer slept). */
export async function summarizeStaleSessions(supabase: SupabaseClient, userId: string, exceptSessionId: string) {
  const cutoff = new Date(Date.now() - IDLE_MINUTES * 60_000).toISOString();
  const { data, error } = await supabase.rpc("stale_sessions", {
    cutoff,
    exclude_session: exceptSessionId,
    min_user_messages: MIN_USER_MESSAGES,
  });
  if (error) return console.error("stale_sessions failed:", error.message);
  for (const row of data ?? []) await summarizeSession(supabase, userId, row.session_id);
}
