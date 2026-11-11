import { getLang } from "@/lib/lang.server";
import { llmConfig } from "@/lib/llm";
import { serverClient, unauthorized } from "@/lib/supabase/server";

export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024;
// Whisper supports Albanian and English. Override with STT_MODEL if your provider names it differently.
const STT_MODEL = process.env.STT_MODEL ?? "whisper-large-v3";
// Mind is spoken to in English or Albanian; anything else Whisper "hears" is almost always a mistake.
const OUR_LANGUAGES = ["english", "en", "albanian", "sq"];
// Above this, Whisper itself thinks a stretch was not speech (breath, noise, silence).
const NO_SPEECH = 0.6;

type Transcript = { text?: string; language?: string; segments?: { no_speech_prob?: number }[] };

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

  async function transcribe(language?: string): Promise<Transcript | null> {
    const form = new FormData();
    form.append("file", audio as File, (audio as File).name || "voice.webm");
    form.append("model", STT_MODEL);
    form.append("response_format", "verbose_json");
    form.append("temperature", "0");
    // A hint in both languages nudges Whisper toward Albanian or English instead of guessing a third.
    form.append("prompt", "Përshëndetje, si je? Hello, how are you?");
    if (language) form.append("language", language);

    const res = await fetch(`${cfg!.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg!.apiKey}` },
      body: form,
    });
    if (!res.ok) {
      console.error("Transcription error", res.status, await res.text());
      return null;
    }
    return res.json();
  }

  let result = await transcribe();
  if (!result) return new Response("Couldn't understand the recording. Please try again.", { status: 502 });

  // Heard a third language (e.g. "hello" turned into Portuguese)? Listen again in the app's language.
  const heard = result.language?.toLowerCase();
  if (heard && !OUR_LANGUAGES.includes(heard)) {
    result = (await transcribe(await getLang())) ?? result;
  }

  // Only noise: return nothing, rather than words Whisper made up.
  const segments = result.segments ?? [];
  if (segments.length > 0 && segments.every((s) => (s.no_speech_prob ?? 0) > NO_SPEECH)) {
    return Response.json({ text: "" });
  }

  const text = typeof result.text === "string" ? result.text.trim() : "";
  // Just punctuation (e.g. "." for a breath) means nothing was said.
  return Response.json({ text: /\p{L}/u.test(text) ? text : "" });
}
