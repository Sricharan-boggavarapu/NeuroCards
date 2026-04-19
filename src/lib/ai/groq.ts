import { extractJsonObject } from "@/lib/ai/json";

/** Groq Cloud free dev API — https://console.groq.com (no paid Vertex/OpenAI in this app). */
const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Default: Llama on Groq free tier — override with GROQ_MODEL */
export const GROQ_MODEL = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
export const GROQ_MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS) || 4096;

function getGroqKey() {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) throw new Error("GROQ_API_KEY is not configured");
  return key;
}

type GroqChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

export async function groqGenerateJson<T>(systemPrompt: string, userPrompt: string): Promise<T> {
  const key = getGroqKey();

  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.35,
      max_tokens: GROQ_MAX_TOKENS,
      response_format: { type: "json_object" },
    }),
  });

  const rawText = await res.text();
  let data: GroqChatResponse;
  try {
    data = JSON.parse(rawText) as GroqChatResponse;
  } catch {
    throw new Error(`Groq returned non-JSON: ${rawText.slice(0, 200)}`);
  }

  if (!res.ok) {
    const msg = data.error?.message || rawText;
    throw new Error(`Groq API ${res.status}: ${msg}`);
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned empty content");
  }

  let parsed: T;
  try {
    parsed = JSON.parse(content) as T;
  } catch {
    parsed = JSON.parse(extractJsonObject(content)) as T;
  }
  return parsed;
}

export async function groqExplainPlain(userPrompt: string): Promise<string> {
  const key = getGroqKey();

  const res = await fetch(GROQ_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You explain ideas clearly for a curious 10-year-old. Short paragraphs, simple words, one analogy if helpful.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 2048,
    }),
  });

  const rawText = await res.text();
  let data: GroqChatResponse;
  try {
    data = JSON.parse(rawText) as GroqChatResponse;
  } catch {
    throw new Error(`Groq returned non-JSON: ${rawText.slice(0, 200)}`);
  }

  if (!res.ok) {
    const msg = data.error?.message || rawText;
    throw new Error(`Groq API ${res.status}: ${msg}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Groq returned empty explanation");
  return content;
}
