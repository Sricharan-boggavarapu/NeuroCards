import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

class MinimalDOMMatrix {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: number[] | string) {
    if (Array.isArray(init) && init.length >= 6) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = init;
    }
  }

  multiplySelf() {
    return this;
  }

  preMultiplySelf() {
    return this;
  }

  translateSelf(tx = 0, ty = 0) {
    this.e += tx;
    this.f += ty;
    return this;
  }

  scaleSelf(scaleX = 1, scaleY = scaleX) {
    this.a *= scaleX;
    this.d *= scaleY;
    return this;
  }

  rotateSelf() {
    return this;
  }

  invertSelf() {
    return this;
  }

  static fromFloat32Array(array: Float32Array) {
    return new MinimalDOMMatrix(Array.from(array));
  }

  static fromFloat64Array(array: Float64Array) {
    return new MinimalDOMMatrix(Array.from(array));
  }

  static fromMatrix(matrix?: { a?: number; b?: number; c?: number; d?: number; e?: number; f?: number }) {
    return new MinimalDOMMatrix([
      matrix?.a ?? 1,
      matrix?.b ?? 0,
      matrix?.c ?? 0,
      matrix?.d ?? 1,
      matrix?.e ?? 0,
      matrix?.f ?? 0,
    ]);
  }
}

class MinimalImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(widthOrData: number | Uint8ClampedArray, width: number, height?: number) {
    if (typeof widthOrData === "number") {
      this.width = widthOrData;
      this.height = width;
      this.data = new Uint8ClampedArray(this.width * this.height * 4);
      return;
    }

    this.data = widthOrData;
    this.width = width;
    this.height = height ?? Math.max(1, Math.floor(widthOrData.length / 4 / width));
  }
}

class MinimalPath2D {
  constructor(path?: string | MinimalPath2D) {
    void path;
  }
}

async function ensurePdfJsRuntime() {
  if (!("DOMMatrix" in globalThis)) {
    Reflect.set(globalThis, "DOMMatrix", MinimalDOMMatrix);
  }
  if (!("ImageData" in globalThis)) {
    Reflect.set(globalThis, "ImageData", MinimalImageData);
  }
  if (!("Path2D" in globalThis)) {
    Reflect.set(globalThis, "Path2D", MinimalPath2D);
  }
  if (!("pdfjsWorker" in globalThis)) {
    const workerModule = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    Reflect.set(globalThis, "pdfjsWorker", workerModule);
  }
}

async function extractPdfText(buffer: Buffer) {
  await ensurePdfJsRuntime();

  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingOptions = {
    data: new Uint8Array(buffer),
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
