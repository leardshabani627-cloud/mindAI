import { chatRequest, llmConfig } from "@/lib/llm";
import { listSummaries, saveMessage, summarizeStaleSessions } from "@/lib/memory";
import { getSettings } from "@/lib/settings";
import { serverClient, unauthorized } from "@/lib/supabase/server";
import { COMPANION_PROMPT, withCompanion, withContacts, withMemory } from "@/prompts/companion";
import { getCompanion } from "@/prompts/companions";

export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 40;
const MAX_CHARS = 4000;
const SUMMARIES_IN_PROMPT = 5;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValid(messages: unknown): messages is ChatMessage[] {
  return (
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.length <= MAX_CHARS,
    ) &&
    messages[messages.length - 1].role === "user"
  );
}

export async function POST(req: Request) {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();

  // Keys live only on the server. The browser talks to this route, never to a provider.
  if (!llmConfig()) {
    return new Response("Server is missing LLM_API_KEY, LLM_BASE_URL or LLM_MODEL. See the README.", {
      status: 500,
    });
  }

  const { sessionId, messages, companion } = await req.json().catch(() => ({}));
  if (typeof sessionId !== "string" || !UUID.test(sessionId) || !isValid(messages)) {
    return new Response("Invalid request.", { status: 400 });
  }

  await saveMessage(supabase, sessionId, "user", messages[messages.length - 1].content);

  // First message of a new chat: wrap up any older sessions that were never ended,
  // so their summaries are part of what the companion knows about me.
  if (messages.length === 1) await summarizeStaleSessions(supabase, user.id, sessionId);

  const [summaries, settings] = await Promise.all([listSummaries(supabase, SUMMARIES_IN_PROMPT), getSettings(supabase)]);
  const system = withContacts(withMemory(withCompanion(COMPANION_PROMPT, getCompanion(companion)), summaries), settings);

  const upstream = await chatRequest(
    [{ role: "system", content: system }, ...messages.slice(-MAX_MESSAGES)],
    true,
  ).catch((err) => {
    console.error("Could not reach the model:", err);
    return null;
  });
  if (!upstream) {
    return new Response("I couldn't reach the AI service. Check your internet connection and try again.", {
      status: 502,
    });
  }
  if (!upstream.ok || !upstream.body) {
    console.error("Provider error", upstream.status, await upstream.text());
    // Free plans allow only so many words per minute.
    if (upstream.status === 429) {
      return new Response("I need a short pause. Send that again in a few seconds. / Më duhet një pushim i shkurtër, provo prapë pas pak sekondash.", {
        status: 429,
      });
    }
    return new Response("The model could not answer right now.", { status: 502 });
  }

  // Convert the provider's server-sent events into a plain text stream for the browser,
  // and keep the full reply so it can be saved when the stream ends.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  let reply = "";

  const textStream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const text = JSON.parse(data).choices?.[0]?.delta?.content;
            if (text) {
              reply += text;
              controller.enqueue(encoder.encode(text));
            }
          } catch {
            // ignore partial or non-JSON lines
          }
        }
      },
      async flush() {
        if (reply) await saveMessage(supabase, sessionId, "assistant", reply);
      },
    }),
  );

  return new Response(textStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
