import { NextRequest, NextResponse } from "next/server";
import { explainFlashcard } from "@/lib/ai/generate-learning";
import { resolveAiProvider, describeProvider } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const provider = resolveAiProvider();

  try {
    if (provider === "groq" && !process.env.GROQ_API_KEY?.trim()) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured. Add a free key from https://console.groq.com/keys or set AI_PROVIDER=gemini with GEMINI_API_KEY." },
        { status: 500 },
      );
    }
    if (provider === "gemini" && !process.env.GEMINI_API_KEY?.trim()) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Or add GROQ_API_KEY to use Groq." },
        { status: 500 },
      );
    }

    const body = await request.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";

    if (!question || !answer) {
      return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });
    }

    const explanation = await explainFlashcard(provider, question, answer);
    return NextResponse.json({ explanation });
  } catch (err) {
    console.error("api/explain", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Could not generate an explanation (${describeProvider(provider)}): ${msg.slice(0, 200)}`,
      },
      { status: 500 },
    );
  }
}
