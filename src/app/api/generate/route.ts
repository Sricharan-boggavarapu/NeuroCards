import { NextRequest, NextResponse } from "next/server";
import { GROQ_MODEL } from "@/lib/ai/groq";
import { generateLearningJson } from "@/lib/ai/generate-learning";
import { resolveAiProvider, describeProvider } from "@/lib/ai/provider";
import { GEMINI_MODEL } from "@/lib/gemini";
import type { GeneratePayload } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const SCHEMA = `Return a single JSON object with this exact shape (no markdown):
{
  "flashcards": [
    { "question": "string", "answer": "string", "type": "definition" | "conceptual" | "why" | "application" }
  ],
  "summary": "string (short, friendly overview for students)",
  "quiz": [
    { "question": "string", "options": ["string", "string", "string", "string"], "correctIndex": 0 }
  ]
}`;

function modelLabel(provider: ReturnType<typeof resolveAiProvider>): string {
  return provider === "groq" ? GROQ_MODEL : GEMINI_MODEL;
}

function formatGenerateError(err: unknown, provider: ReturnType<typeof resolveAiProvider>): { message: string; status: number } {
  if (!(err instanceof Error)) {
    return { message: "Generation failed. Try again in a moment.", status: 500 };
  }
  const msg = err.message;

  if (msg.includes("GROQ_API_KEY is not configured")) {
    return {
      message:
        "GROQ_API_KEY is missing. Get a free key at https://console.groq.com/keys and add it to neurocards/.env.local, then restart npm run dev. Or set AI_PROVIDER=gemini and use GEMINI_API_KEY instead.",
      status: 500,
    };
  }

  if (msg.includes("GEMINI_API_KEY is not configured")) {
    return {
      message:
        "GEMINI_API_KEY is missing. Add it from https://aistudio.google.com/apikey or switch to Groq: set GROQ_API_KEY and optionally AI_PROVIDER=groq.",
      status: 500,
    };
  }

  if (/Groq API 401|invalid api key|Invalid API key/i.test(msg)) {
    return {
      message:
        "Groq rejected the API key. Create a new key at https://console.groq.com/keys and update GROQ_API_KEY in .env.local.",
      status: 401,
    };
  }

  if (/API key not valid|API_KEY_INVALID|invalid api key/i.test(msg) && provider === "gemini") {
    return {
      message:
        "Gemini rejected the API key. Check GEMINI_API_KEY in .env.local or switch to Groq (GROQ_API_KEY + AI_PROVIDER=groq).",
      status: 401,
    };
  }

  if (/404|not found|is not found|Unsupported model/i.test(msg) && provider === "gemini") {
    return {
      message: `Gemini model "${GEMINI_MODEL}" is not available. Set GEMINI_MODEL=gemini-2.5-flash in .env.local or use Groq with GROQ_API_KEY.`,
      status: 502,
    };
  }

  if (/Groq API 429|429|quota|resource exhausted|rate limit/i.test(msg)) {
    return {
      message: `${describeProvider(provider)} rate limit or quota reached. Wait a minute, try again, or configure the other provider (${provider === "groq" ? "Gemini" : "Groq"}) in .env.local.`,
      status: 429,
    };
  }

  if (/429|quota|resource exhausted|rate limit/i.test(msg) && provider === "gemini") {
    return {
      message:
        "Gemini rate limit reached. Add GROQ_API_KEY from https://console.groq.com/keys (free) and restart — Groq is used by default when both keys are set.",
      status: 429,
    };
  }

  if (/JSON|Unexpected token|parse/i.test(msg)) {
    return {
      message: "The model returned unreadable JSON. Try again, or shorten the PDF text and retry.",
      status: 502,
    };
  }

  if (/blocked|safety|SAFETY/i.test(msg)) {
    return {
      message: "The content was blocked by safety filters. Try a different PDF or smaller excerpt.",
      status: 400,
    };
  }

  return {
    message: `Generation failed (${describeProvider(provider)} / ${modelLabel(provider)}): ${msg.slice(0, 280)}`,
    status: 500,
  };
}

function missingKeyResponse(provider: ReturnType<typeof resolveAiProvider>) {
  if (provider === "groq") {
    return NextResponse.json(
      {
        error:
          "GROQ_API_KEY is not set. Get a free API key at https://console.groq.com/keys and add GROQ_API_KEY to neurocards/.env.local, then restart. To use only Gemini instead: set AI_PROVIDER=gemini and GEMINI_API_KEY.",
      },
      { status: 500 },
    );
  }
  return NextResponse.json(
    {
      error:
        "GEMINI_API_KEY is not set. Add it from https://aistudio.google.com/apikey or use Groq: set GROQ_API_KEY (recommended free tier).",
    },
    { status: 500 },
  );
}

export async function POST(request: NextRequest) {
  const provider = resolveAiProvider();

  try {
    if (provider === "groq" && !process.env.GROQ_API_KEY?.trim()) {
      return missingKeyResponse("groq");
    }
    if (provider === "gemini" && !process.env.GEMINI_API_KEY?.trim()) {
      return missingKeyResponse("gemini");
    }

    const body = await request.json();
    const text = typeof body.text === "string" ? body.text : "";
    const deckTitle =
      typeof body.deckTitle === "string" && body.deckTitle.trim()
        ? body.deckTitle.trim()
        : "New deck";

    if (text.length < 80) {
      return NextResponse.json({ error: "Content is too short to generate cards." }, { status: 400 });
    }

    const prompt = `You are an expert tutor helping students (including younger learners) remember ideas for the long term.

Convert the following study material into high-quality learning content.

Requirements:
- Flashcards: mix definitions, conceptual understanding, "why" questions, and short application prompts.
- Keep answers concise, clear, and kind — no fluff.
- Avoid duplicate questions.
- Aim for 12–20 flashcards depending on how rich the material is.
- Summary: 3–5 sentences, plain language.
- Quiz: exactly 5 multiple-choice questions with 4 options each; vary difficulty.

Study material:
---
${text}
---

Deck title hint: ${deckTitle}`;

    const data = await generateLearningJson<GeneratePayload>(provider, prompt, SCHEMA);

    if (!data.flashcards?.length) {
      return NextResponse.json({ error: "Could not generate flashcards." }, { status: 502 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("api/generate", err);
    const { message, status } = formatGenerateError(err, provider);
    return NextResponse.json({ error: message }, { status });
  }
}
