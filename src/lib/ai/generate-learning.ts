import { groqExplainPlain, groqGenerateJson } from "@/lib/ai/groq";
import type { AiProviderId } from "@/lib/ai/provider";
import { generateStructured as geminiGenerateStructured, getGemini, GEMINI_MODEL } from "@/lib/gemini";

const JSON_SYSTEM =
  "You output only valid JSON matching the user's schema. No markdown, no commentary outside the JSON object.";

export async function generateLearningJson<T>(
  provider: AiProviderId,
  prompt: string,
  schemaHint: string,
): Promise<T> {
  if (provider === "groq") {
    return groqGenerateJson<T>(JSON_SYSTEM, `${prompt}\n\n${schemaHint}`);
  }
  return geminiGenerateStructured<T>(prompt, schemaHint);
}

export async function explainFlashcard(provider: AiProviderId, question: string, answer: string): Promise<string> {
  const user = `Explain the following flashcard in a way a curious 10-year-old would understand. Use short paragraphs, simple words, and one relatable analogy if it helps. No bullet lists longer than 4 items.

Question: ${question}
Answer: ${answer}`;

  if (provider === "groq") {
    return groqExplainPlain(user);
  }

  const genAI = getGemini();
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { temperature: 0.4 },
  });
  const result = await model.generateContent(user);
  return result.response.text().trim();
}

export { GEMINI_MODEL };
