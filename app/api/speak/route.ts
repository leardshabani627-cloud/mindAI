import { llmConfig } from "@/lib/llm";
import { serverClient, unauthorized } from "@/lib/supabase/server";
import { VOICES } from "@/prompts/companions";

export const maxDuration = 30;

// Natural English text-to-speech, through the same provider and key as the chat
// (Groq's Orpheus model on its free tier). Override with TTS_MODEL if your provider names it differently.
const TTS_MODEL = process.env.TTS_MODEL ?? "canopylabs/orpheus-v1-english";
const MAX_CHARS = 400; // the browser sends a reply in sentence-sized pieces

// Turns a piece of a reply into speech. The audio is streamed straight back and never stored.
export async function POST(req: Request) {
  const { user } = await serverClient();
  if (!user) return unauthorized();

  const cfg = llmConfig();
  if (!cfg) return new Response("Server is missing LLM settings.", { status: 500 });

  const { text, voice } = await req.json().catch(() => ({}));
  if (typeof text !== "string" || !text.trim() || text.length > MAX_CHARS || !VOICES.includes(voice)) {
    return new Response("Invalid request.", { status: 400 });
  }

  const upstream = await fetch(`${cfg.baseUrl}/audio/speech`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: TTS_MODEL, input: text.trim(), voice, response_format: "wav" }),
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);

  if (!upstream?.ok || !upstream.body) {
    if (upstream) console.error("Speech error", upstream.status, await upstream.text());
    // The browser falls back to the device's own voice.
    return new Response("Couldn't make the voice right now.", { status: upstream?.status === 429 ? 429 : 502 });
  }
  return new Response(upstream.body, {
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "audio/wav", "Cache-Control": "no-store" },
  });
}
