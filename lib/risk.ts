import { llmConfig } from "@/lib/llm";
import { RISK_POLICY } from "@/prompts/risk";

// Server only. The second crisis check: a small, fast model reads the latest messages against a safety
// policy (prompts/risk.ts) and says high, concern or none. The phrase list in lib/crisis.ts still runs in
// the browser; this one understands indirect ways of saying it ("everyone would be better off without me").
// It uses its own model, so it doesn't eat into the chat model's limit. Override with RISK_MODEL.

export type Risk = "high" | "concern" | "none";

const RISK_MODEL = process.env.RISK_MODEL ?? "openai/gpt-oss-20b";
const CONTEXT_MESSAGES = 4; // the latest message plus a little of what came before
const TIMEOUT_MS = 4000;

/** Rates the person's latest message. Returns null if the check couldn't run (the chat goes on regardless). */
export async function assessRisk(messages: { role: "user" | "assistant"; content: string }[]): Promise<Risk | null> {
  const cfg = llmConfig();
  if (!cfg) return null;

  const recent = messages.slice(-CONTEXT_MESSAGES);
  const latest = recent[recent.length - 1];
  const earlier = recent
    .slice(0, -1)
    .map((m) => `${m.role === "user" ? "PERSON" : "COMPANION"}: ${m.content.slice(0, 600)}`)
    .join("\n");
  const input = `${earlier ? `Earlier messages (context only):\n${earlier}\n\n` : ""}PERSON's latest message:\n${latest.content.slice(0, 2000)}`;

  try {
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model: RISK_MODEL,
        messages: [
          { role: "system", content: RISK_POLICY },
          { role: "user", content: input },
        ],
        temperature: 0,
        max_tokens: 400,
        reasoning_effort: "low",
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("Risk check error", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const answer: string = (await res.json()).choices?.[0]?.message?.content?.toLowerCase() ?? "";
    const level = answer.match(/\b(high|concern|none)\b/)?.[1];
    return (level as Risk) ?? null;
  } catch (err) {
    console.error("Risk check failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
