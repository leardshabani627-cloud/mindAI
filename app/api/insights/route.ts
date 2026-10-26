import { complete, llmConfig } from "@/lib/llm";
import { listSummaries } from "@/lib/memory";
import { listMood } from "@/lib/mood";
import { serverClient, unauthorized } from "@/lib/supabase/server";
import { INSIGHTS_PROMPT } from "@/prompts/insights";

export const maxDuration = 60;

const weekday = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

export async function POST() {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  if (!llmConfig()) return new Response("The model is not configured.", { status: 500 });

  const [mood, summaries] = await Promise.all([listMood(supabase, 30), listSummaries(supabase, 10)]);
  if (mood.length === 0 && summaries.length === 0) {
    return new Response("Nothing to look at yet. Add a few check-ins first.", { status: 400 });
  }

  const moodLines = mood.map(
    (m) => `- ${m.entry_date} (${weekday(m.entry_date)}): ${m.mood}/10${m.note ? ` - "${m.note}"` : ""}`,
  );
  const summaryLines = [...summaries].reverse().map(
    (s) => `- (${s.created_at.slice(0, 10)}) ${s.summary}${s.themes.length ? ` [themes: ${s.themes.join(", ")}]` : ""}`,
  );

  const input = [
    `Mood check-ins, last 30 days:\n${moodLines.join("\n") || "(none yet)"}`,
    `Notes from past conversations (oldest first):\n${summaryLines.join("\n") || "(none yet)"}`,
  ].join("\n\n");

  try {
    return Response.json({ reflection: (await complete(INSIGHTS_PROMPT, input)).trim() });
  } catch (err) {
    console.error("insights failed:", err);
    return new Response("The model could not answer right now.", { status: 502 });
  }
}
