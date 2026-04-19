export type AiProviderId = "groq" | "gemini";

/**
 * Free-tier LLM backends only (Groq dev API + Google AI Studio Gemini — no paid Vertex/OpenAI here).
 * - `AI_PROVIDER=groq` | `gemini` to force.
 * - If unset: Groq when GROQ_API_KEY exists, else Gemini when GEMINI_API_KEY exists; if both exist, Groq first.
 */
export function resolveAiProvider(): AiProviderId {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "groq" || explicit === "gemini") {
    return explicit;
  }
  const hasGroq = Boolean(process.env.GROQ_API_KEY?.trim());
  const hasGemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  if (hasGroq && !hasGemini) return "groq";
  if (hasGemini && !hasGroq) return "gemini";
  if (hasGroq && hasGemini) return "groq";
  return "groq";
}

export function describeProvider(p: AiProviderId): string {
  return p === "groq" ? "Groq" : "Gemini";
}
