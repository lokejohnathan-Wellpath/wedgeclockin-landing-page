// Wedge AI Eye OCR adapter.
//
// Dense supplier invoices can make a normal Tesseract pass return a false 0% when
// watermarks, shadows and table borders dominate the image. This adapter keeps the
// normal pass, then only for weak results retries an adaptive-threshold copy and,
// for portrait invoices, separate header/footer crops. The original source file is
// never altered and remains the audit evidence stored by WedgeBooks.

export const PSM = {
  OSD_ONLY: "0",
  AUTO_OSD: "1",
  AUTO_ONLY: "2",
  AUTO: "3",
  SINGLE_COLUMN: "4",
  SINGLE_BLOCK_VERT_TEXT: "5",
  SINGLE_BLOCK: "6",
  SINGLE_LINE: "7",
  SINGLE_WORD: "8",
  CIRCLE_WORD: "9",
  SINGLE_CHAR: "10",
  SPARSE_TEXT: "11",
  SPARSE_TEXT_OSD: "12",
  RAW_LINE: "13",
} as const;

type OcrResult = {
  data?: {
    text?: string;
    confidence?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type TesseractRuntime = {
  createWorker: (...args: unknown[]) => Promise<any>;
};

type Region = { x: number; y: number; width: number; height: number };

const runtimeUrl = "https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js";
let runtimePromise: Promise<TesseractRuntime> | null = null;

function browserRuntime() {
  return (window as typeof window & { Tesseract?: TesseractRuntime }).Tesseract;
}

async function loadRuntime() {
  if (typeof window === "undefined") {
    throw new Error("Wedge AI Eye OCR is only available in the browser.");
  }
  const existing = browserRuntime();
  if (existing?.createWorker) return existing;
  if (runtimePromise) return runtimePromise;

  runtimePromise = new Promise<TesseractRuntime>((resolve, reject) => {
    const ready = browserRuntime();
    if (ready?.createWorker) {
      resolve(ready);
      return;
    }

    const previous = document.querySelector<HTMLScriptElement>(`script[data-wedge-tesseract="7"]`);
    const finish = () => {
      const runtime = browserRuntime();
      if (runtime?.createWorker) resolve(runtime);
      else reject(new Error("The OCR runtime loaded but did not initialise."));
    };

    if (previous) {
      previous.addEventListener("load", finish, { once: true });
      previous.addEventListener("error", () => reject(new Error("The OCR runtime could not be loaded.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = runtimeUrl;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.dataset.wedgeTesseract = "7";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("The OCR runtime could not be loaded.")), { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    runtimePromise = null;
    throw error;
  });

  return runtimePromise;
}

function normalisedLine(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeOcrText(parts: string[]) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const part of parts) {
    for (const rawLine of String(part || "").split(/\r?\n/)) {
      const line = rawLine.replace(/\s+/g, " ").trim();
      if (!line) continue;
      const key = normalisedLine(line);
      if (key.length < 2 || seen.has(key)) continue;
      seen.add(key);
      output.push(line);
    }
  }
  return output.join("\n");
}

function evidenceScore(text: string) {
  const clean = String(text || "");
  const letters = clean.match(/\p{L}/gu)?.length ?? 0;
  const digits = clean.match(/\d/g)?.length ?? 0;
  const money = clean.match(/(?:RM\s*)?\d[\d,]*[.,]\d{2}\b/gi)?.length ?? 0;
  const dates = clean.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g)?.length ?? 0;
  const documentWords = /\b(invoice|invois|receipt|resit|subtotal|grand\s*total|amount|qty|description)\b/i.test(clean);
  const supplierWords = /sdn\s*bhd|enterprise|trading|distribution|supplies|supplier|vendor|market|mart|store/i.test(clean);
  return (
    Math.min(30, letters / 8) +
    Math.min(10, digits / 8) +
    Math.min(24, money * 6) +
    Math.min(10, dates * 5) +
    (documentWords ? 12 : 0) +
    (supplierWords ? 14 : 0)
  );
}

function inferredConfidence(text: string) {
  const score = evidenceScore(text);
  if (score >= 70) return 76;
  if (score >= 52) return 66;
  if (score >= 38) return 55;
  if (score >= 24) return 42;
  return 0;
}

function resultConfidence(result: OcrResult) {
  const value = Number(result?.data?.confidence ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function resultText(result: OcrResult) {
  return String(result?.data?.text ?? "").trim();
}

function shouldRescue(result: OcrResult) {
  const text = resultText(result);
  const confidence = resultConfidence(result);
  if (!text) return true;
  if (confidence < 48) return true;
  if (text.length < 90) return true;
  if (!/(?:RM\s*)?\d[\d,]*[.,]\d{2}\b/i.test(text) && /invoice|receipt|resit|invois/i.test(text)) {
    return true;
  }
  return false;
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("OCR rescue image could not be prepared."));
    }, "image/png", 1);
  });
}

async function adaptiveThresholdBlob(source: Blob, region?: Region) {
  const image = await createImageBitmap(source);
  try {
    const sx = Math.max(0, Math.round((region?.x ?? 0) * image.width));
    const sy = Math.max(0, Math.round((region?.y ?? 0) * image.height));
    const sw = Math.max(1, Math.round((region?.width ?? 1) * image.width));
    const sh = Math.max(1, Math.round((region?.height ?? 1) * image.height));

    const targetWidth = Math.max(sw, Math.min(2800, Math.round(sw * 2.25)));
    const scale = targetWidth / sw;
    const width = Math.max(1, Math.round(sw * scale));
    const height = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("OCR rescue canvas is unavailable.");

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.filter = "grayscale(1) contrast(1.18) brightness(1.08)";
    context.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);

    const pixels = context.getImageData(0, 0, width, height);
    const count = width * height;
    const gray = new Uint8Array(count);
    const integral = new Uint32Array((width + 1) * (height + 1));

    for (let y = 0; y < height; y += 1) {
      let rowSum = 0;
      const integralRow = (y + 1) * (width + 1);
      const previousRow = y * (width + 1);
      for (let x = 0; x < width; x += 1) {
        const pixelIndex = y * width + x;
        const rgba = pixelIndex * 4;
        const value = Math.round(
          pixels.data[rgba] * 0.2126 +
          pixels.data[rgba + 1] * 0.7152 +
          pixels.data[rgba + 2] * 0.0722,
        );
        gray[pixelIndex] = value;
        rowSum += value;
        integral[integralRow + x + 1] = integral[previousRow + x + 1] + rowSum;
      }
    }

    const radius = Math.max(10, Math.min(28, Math.round(Math.min(width, height) * 0.009)));
    for (let y = 0; y < height; y += 1) {
      const y1 = Math.max(0, y - radius);
      const y2 = Math.min(height - 1, y + radius);
      for (let x = 0; x < width; x += 1) {
        const x1 = Math.max(0, x - radius);
        const x2 = Math.min(width - 1, x + radius);
        const a = y1 * (width + 1) + x1;
        const b = y1 * (width + 1) + x2 + 1;
        const c = (y2 + 1) * (width + 1) + x1;
        const d = (y2 + 1) * (width + 1) + x2 + 1;
        const area = (x2 - x1 + 1) * (y2 - y1 + 1);
        const mean = (integral[d] - integral[b] - integral[c] + integral[a]) / area;
        const value = gray[y * width + x] < mean - 10 ? 0 : 255;
        const rgba = (y * width + x) * 4;
        pixels.data[rgba] = value;
        pixels.data[rgba + 1] = value;
        pixels.data[rgba + 2] = value;
        pixels.data[rgba + 3] = 255;
      }
    }

    context.putImageData(pixels, 0, 0);
    return await canvasBlob(canvas);
  } finally {
    image.close();
  }
}

function bestResult(results: OcrResult[]) {
  return [...results].sort((left, right) => {
    const leftScore = evidenceScore(resultText(left)) + resultConfidence(left) * 0.35;
    const rightScore = evidenceScore(resultText(right)) + resultConfidence(right) * 0.35;
    return rightScore - leftScore;
  })[0];
}

export async function createWorker(...args: unknown[]) {
  const runtime = await loadRuntime();
  const worker = await runtime.createWorker(...args);
  const originalRecognize = worker.recognize.bind(worker);
  const originalSetParameters = worker.setParameters.bind(worker);
  let activeParameters: Record<string, unknown> = {};

  worker.setParameters = async (parameters: Record<string, unknown>) => {
    activeParameters = { ...activeParameters, ...parameters };
    return originalSetParameters(parameters);
  };

  worker.recognize = async (image: unknown, options?: unknown, output?: unknown) => {
    const first = await originalRecognize(image, options, output) as OcrResult;
    if (!shouldRescue(first) || typeof window === "undefined" || !(image instanceof Blob)) {
      return first;
    }

    try {
      const rescued: OcrResult[] = [first];
      const adaptive = await adaptiveThresholdBlob(image);
      rescued.push(await originalRecognize(adaptive, options, output) as OcrResult);

      const bitmap = await createImageBitmap(image);
      const portraitDocument = bitmap.height > bitmap.width * 1.08;
      bitmap.close();

      if (portraitDocument) {
        const previousMode = activeParameters.tessedit_pageseg_mode;
        await originalSetParameters({
          ...activeParameters,
          tessedit_pageseg_mode: PSM.SPARSE_TEXT,
          preserve_interword_spaces: "1",
        });

        const header = await adaptiveThresholdBlob(image, { x: 0, y: 0, width: 1, height: 0.36 });
        const footer = await adaptiveThresholdBlob(image, { x: 0, y: 0.68, width: 1, height: 0.32 });
        const headerResult = await originalRecognize(header, options, output) as OcrResult;
        const footerResult = await originalRecognize(footer, options, output) as OcrResult;
        rescued.push(headerResult, footerResult);

        if (previousMode !== undefined) {
          await originalSetParameters({ ...activeParameters, tessedit_pageseg_mode: previousMode });
        }

        const strongest = bestResult(rescued);
        const merged = mergeOcrText([
          resultText(headerResult),
          resultText(strongest),
          ...rescued.map(resultText),
          resultText(footerResult),
        ]);
        return {
          ...strongest,
          data: {
            ...(strongest?.data ?? {}),
            text: merged,
            confidence: Math.max(
              ...rescued.map(resultConfidence),
              inferredConfidence(merged),
            ),
          },
        };
      }

      const strongest = bestResult(rescued);
      const merged = mergeOcrText(rescued.map(resultText));
      return {
        ...strongest,
        data: {
          ...(strongest?.data ?? {}),
          text: merged,
          confidence: Math.max(
            ...rescued.map(resultConfidence),
            inferredConfidence(merged),
          ),
        },
      };
    } catch (error) {
      console.warn("Wedge AI Eye adaptive OCR rescue skipped:", error);
      return first;
    }
  };

  return worker;
}
