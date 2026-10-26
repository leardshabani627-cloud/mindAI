// Shared access to the LLM provider (server only). Configured through env variables.

export function llmConfig() {
  const { LLM_API_KEY, LLM_BASE_URL, LLM_MODEL } = process.env;
  if (!LLM_API_KEY || !LLM_BASE_URL || !LLM_MODEL) return null;
  return {
    apiKey: LLM_API_KEY,
    baseUrl: LLM_BASE_URL.replace(/\/$/, ""),
    model: LLM_MODEL,
    // Optional, for reasoning models (e.g. Groq's gpt-oss): "low" keeps replies quick and natural.
    reasoningEffort: process.env.LLM_REASONING_EFFORT || undefined,
  };
}

type Message = { role: "system" | "user" | "assistant"; content: string };

/** POST to the provider's chat endpoint. Returns the raw Response. */
export function chatRequest(messages: Message[], stream: boolean) {
  const cfg = llmConfig();
  if (!cfg) throw new Error("LLM is not configured");
  return fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({ model: cfg.model, stream, messages, reasoning_effort: cfg.reasoningEffort }),
    signal: AbortSignal.timeout(45_000), // fail with a clear error instead of hanging for minutes
  });
}

/** One-shot (non-streaming) completion, returns the reply text.
 *  If the free plan's per-minute limit is hit, it waits (up to 15 s) and tries once more. */
export async function complete(system: string, user: string): Promise<string> {
  const messages: Message[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
  let res = await chatRequest(messages, false);
  if (res.status === 429) {
    const wait = Math.min(15, Number(res.headers.get("retry-after")) || 8);
    await new Promise((r) => setTimeout(r, wait * 1000));
    res = await chatRequest(messages, false);
  }
  if (!res.ok) throw new Error(`Provider error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}
