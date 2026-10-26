import { llmConfig } from "@/lib/llm";
import { serverClient, unauthorized } from "@/lib/supabase/server";

export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
// Whisper supports Albanian and English. Override with STT_MODEL if your provider names it differently.
const STT_MODEL = process.env.STT_MODEL ?? "whisper-large-v3";

// Turns a short voice recording into text, using the same provider and key as the chat
// (Groq offers Whisper on its free tier). The audio is not stored.
export async function POST(req: Request) {
  const { user } = await serverClient();
  if (!user) return unauthorized();

  const cfg = llmConfig();
  if (!cfg) return new Response("Server is missing LLM settings.", { status: 500 });

  const incoming = await req.formData().catch(() => null);
  const audio = incoming?.get("audio");
  if (!(audio instanceof File) || audio.size === 0 || audio.size > MAX_BYTES) {
    return new Response("Invalid audio.", { status: 400 });
  }

  const form = new FormData();
  form.append("file", audio, audio.name || "voice.webm");
  form.append("model", STT_MODEL);
  form.append("response_format", "json");
  form.append("temperature", "0");
  // A hint in both languages nudges Whisper toward Albanian or English instead of guessing a third.
  form.append("prompt", "Përshëndetje, si je? Hello, how are you?");

  const res = await fetch(`${cfg.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cfg.apiKey}` },
    body: form,
  });
  if (!res.ok) {
    console.error("Transcription error", res.status, await res.text());
    return new Response("Couldn't understand the recording. Please try again.", { status: 502 });
  }

  const { text } = await res.json();
  return Response.json({ text: typeof text === "string" ? text.trim() : "" });
}
