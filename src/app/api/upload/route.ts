import { NextRequest, NextResponse } from "next/server";
import { createRequire } from "node:module";

export const runtime = "nodejs";
export const maxDuration = 120;

const require = createRequire(import.meta.url);

async function extractPdfText(buffer: Buffer) {
  const canvas = require("@napi-rs/canvas") as typeof import("@napi-rs/canvas");

  if (!("DOMMatrix" in globalThis)) {
    // pdfjs-dist expects these globals in non-browser runtimes.
    Reflect.set(globalThis, "DOMMatrix", canvas.DOMMatrix);
  }
  if (!("ImageData" in globalThis)) {
    Reflect.set(globalThis, "ImageData", canvas.ImageData);
  }
  if (!("Path2D" in globalThis)) {
    Reflect.set(globalThis, "Path2D", canvas.Path2D);
  }

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingOptions = {
    data: new Uint8Array(buffer),
    disableWorker: true,
    isEvalSupported: false,
    useWorkerFetch: false,
  } as unknown as Parameters<typeof pdfjs.getDocument>[0];
  const loadingTask = pdfjs.getDocument(loadingOptions);

  const pdf = await loadingTask.promise;
  let text = "";

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      text += `${pageText}\n`;
    }
  } finally {
    await pdf.destroy();
  }

  return text;
}

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
    const text = (await extractPdfText(buffer)).replace(/\s+/g, " ").trim();

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
