import { GUEST_DAILY_MESSAGES } from "@/lib/guest";
import { chatRequest, llmConfig } from "@/lib/llm";
import { assessRisk } from "@/lib/risk";
import { listSummaries, saveMessage, summarizeStaleSessions } from "@/lib/memory";
import { getSettings } from "@/lib/settings";
import { isGuest, serverClient, unauthorized } from "@/lib/supabase/server";
import { COMPANION_PROMPT, withCompanion, withContacts, withMemory, withName, withSafetyPlan } from "@/prompts/companion";
import { getCompanion } from "@/prompts/companions";

export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 40;
const MAX_CHARS = 4000;
const SUMMARIES_IN_PROMPT = 5;
const CHAT_TEMPERATURE = 0.85; // natural, varied wording in conversation
// Control characters and stray special symbols the model occasionally emits; never meant to be shown.
const HIDDEN_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\uE000-\uF8FF\uFFFD]/g;
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

type Supabase = Awaited<ReturnType<typeof serverClient>>["supabase"];

// Guest limits use tamper-proof counters in the database (see the guest_usage_counter and
// all_guests_daily_cap migrations): one per guest per day, and one for all guests together.
// The limits themselves are set in the database, so nobody can pass in their own.

/** Messages this guest has left today, and whether guest chat is full for everyone today. */
async function guestStatus(supabase: Supabase) {
  const { data, error } = await supabase.rpc("guest_chat_status");
  if (error) console.error("Guest usage check failed:", error.message);
  return { left: typeof data?.left === "number" ? data.left : GUEST_DAILY_MESSAGES, full: data?.full === true };
}

/** Counts this message. Returns how many are left after it, -1 at the guest's own limit,
 *  -2 when all guests together reached today's cap, or null if the check failed. */
async function useGuestMessage(supabase: Supabase) {
  const { data, error } = await supabase.rpc("use_guest_message");
  if (error) {
    console.error("Guest usage count failed:", error.message);
    return null;
  }
  return typeof data === "number" ? data : null;
}

// For the chat screen: is this a guest, and how many messages are left today.
export async function GET() {
  const { supabase, user } = await serverClient();
  if (!user) return unauthorized();
  if (!isGuest(user)) return Response.json({ guest: false, left: null });
  const { left, full } = await guestStatus(supabase);
  return Response.json({ guest: true, left: full ? 0 : left, full, limit: GUEST_DAILY_MESSAGES });
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

  const guest = isGuest(user);
  let guestLeft: number | null = null;
  if (guest) {
    const left = await useGuestMessage(supabase);
    // If the counter can't be reached, don't let guests through uncounted.
    if (left === null) return new Response("Something went wrong. Please try again.", { status: 503 });
    if (left < 0) {
      const headers: Record<string, string> = { "X-Guest-Left": "0" };
      if (left === -2) headers["X-Guests-Full"] = "1"; // everyone's guest chats are used up for today
      return new Response("Guest limit reached.", { status: 403, headers });
    }
    guestLeft = left;
  }

  await saveMessage(supabase, sessionId, "user", messages[messages.length - 1].content);

  // First message of a new chat: wrap up any older sessions that were never ended,
  // so their summaries are part of what the companion knows about me. Guests have no memories.
  if (messages.length === 1 && !guest) await summarizeStaleSessions(supabase, user.id, sessionId);

  // The safety check runs alongside loading memories and settings, so it adds almost no wait.
  const [summaries, settings, risk] = await Promise.all([
    guest ? Promise.resolve([]) : listSummaries(supabase, SUMMARIES_IN_PROMPT),
    getSettings(supabase),
    assessRisk(messages),
  ]);
  // The full instructions: base prompt, chosen companion, my name, memories, contacts and safety plan.
  let system = withCompanion(COMPANION_PROMPT, getCompanion(companion));
  system = withName(system, settings.display_name);
  system = withMemory(system, summaries);
  system = withContacts(system, settings);
  system = withSafetyPlan(system, settings.safety_plan);
  // The second crisis check found risk: the safety steps come first in this reply.
  if (risk === "high") {
    system +=
      "\n\nIMPORTANT, for this reply: their latest message may mean they are thinking about suicide or self-harm, " +
      "or are in danger. Follow your safety steps now, warmly and calmly: acknowledge what they said, then ask " +
      "directly and kindly whether they're thinking about ending their life or hurting themselves, and whether " +
      "they're safe right now. Never mention any check, system or flag.";
  } else if (risk === "concern") {
    system +=
      "\n\nFor this reply: they may be feeling hopeless or like a burden. Take it seriously and stay with it. " +
      "Gently acknowledge it, and if it fits, kindly ask how heavy it gets, for example whether they ever have " +
      "thoughts of not wanting to be here. Never mention any check, system or flag.";
  }
  // Models fall into "reflect, then ask" every turn. After a question, nudge toward a plain reaction instead
  // (never when there's risk: then a direct, caring question is exactly right).
  const lastReply = [...messages].reverse().find((m) => m.role === "assistant")?.content.trim() ?? "";
  if (lastReply.endsWith("?") && risk !== "high" && risk !== "concern") {
    system += "\n\nYour previous reply ended with a question. This time, don't ask one: just react like a person would, " +
      "normalise, or offer a short hunch, and let them keep talking. (Safety questions are the exception.)";
  }

  const upstream = await chatRequest(
    [{ role: "system", content: system }, ...messages.slice(-MAX_MESSAGES)],
    true,
    CHAT_TEMPERATURE,
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
            const text = JSON.parse(data).choices?.[0]?.delta?.content?.replace(HIDDEN_CHARS, "").replace(/\s*[—–]\s*/g, ", ");
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
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      ...(guestLeft !== null && { "X-Guest-Left": String(guestLeft) }),
      ...(risk && { "X-Risk": risk }), // lets the chat show the help banner
    },
  });
}
