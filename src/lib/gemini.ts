import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractJsonObject } from "@/lib/ai/json";

/**
 * Default for current Google AI Studio keys.
 * Override GEMINI_MODEL if needed (e.g. gemini-2.5-flash, gemini-1.5-flash-8b).
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

export function getGemini() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenerativeAI(key);
}

export { extractJsonObject };

export async function generateStructured<T>(prompt: string, schemaHint: string): Promise<T> {
  const genAI = getGemini();
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.35,
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(`${prompt}\n\n${schemaHint}`);
  const raw = result.response.text();
  let parsed: T;
  try {
    parsed = JSON.parse(raw) as T;
  } catch {
    parsed = JSON.parse(extractJsonObject(raw)) as T;
  }
  return parsed;
}
