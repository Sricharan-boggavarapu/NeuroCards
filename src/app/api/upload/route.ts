import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Please upload a PDF file." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    const text = (data.text || "").replace(/\s+/g, " ").trim();

    if (text.length < 80) {
      return NextResponse.json(
        {
          error:
            "We could not read enough text from this PDF. Try a text-based PDF or another file.",
        },
        { status: 400 },
      );
    }

    const maxChars = 48_000;
    const clipped = text.length > maxChars ? text.slice(0, maxChars) : text;

    return NextResponse.json({
      text: clipped,
      filename: file.name,
      truncated: text.length > maxChars,
    });
  } catch (err) {
    console.error("upload/pdf-parse", err);
    return NextResponse.json({ error: "Could not process this PDF." }, { status: 500 });
  }
}
