// Stable WedgeBooks OCR adapter.
// Uses the Tesseract package already installed in this app. No CDN/script injection.
// Keep the first pass deliberately English-only: most Malaysian invoices use English
// field labels/numbers and one lightweight language pack is much more reliable on
// ordinary browsers. Wedge Brain can still classify Chinese/Malay text that OCR returns.
import * as RealTesseract from "../../../node_modules/tesseract.js/dist/tesseract.esm.min.js";

export const PSM = RealTesseract.PSM;

function asError(error, fallback) {
  if (error instanceof Error) return error;
  if (error && typeof error === "object" && "message" in error) {
    return new Error(String(error.message || fallback));
  }
  const text = String(error || "").trim();
  return new Error(text || fallback);
}

function withTimeout(promise, milliseconds, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    }),
  ]).finally(() => clearTimeout(timer));
}

function primaryLanguage(languages) {
  if (Array.isArray(languages)) {
    const values = languages.map((value) => String(value).trim()).filter(Boolean);
    if (values.includes("eng")) return "eng";
    return values[0] || "eng";
  }
  const values = String(languages || "eng").split("+").map((value) => value.trim()).filter(Boolean);
  if (values.includes("eng")) return "eng";
  return values[0] || "eng";
}

export async function createWorker(languages = "eng", oem, options, config) {
  let worker;
  try {
    worker = await withTimeout(
      RealTesseract.createWorker(primaryLanguage(languages), oem, options, config),
      30000,
      "AI Eye could not initialise the OCR engine within 30 seconds. Please retry once.",
    );
  } catch (error) {
    throw asError(error, "AI Eye could not initialise the OCR engine.");
  }

  const originalRecognize = worker.recognize.bind(worker);
  const originalSetParameters = worker.setParameters.bind(worker);
  const originalTerminate = worker.terminate.bind(worker);

  worker.setParameters = async (parameters) => {
    try {
      return await withTimeout(
        originalSetParameters(parameters),
        10000,
        "AI Eye could not configure the OCR engine.",
      );
    } catch (error) {
      throw asError(error, "AI Eye could not configure the OCR engine.");
    }
  };

  worker.recognize = async (...args) => {
    try {
      return await withTimeout(
        originalRecognize(...args),
        45000,
        "AI Eye took too long to read this image. Please retry with the document filling more of the photo.",
      );
    } catch (error) {
      throw asError(error, "AI Eye could not read this document image.");
    }
  };

  worker.terminate = async () => {
    try {
      return await withTimeout(originalTerminate(), 5000, "OCR worker shutdown timed out.");
    } catch {
      return undefined;
    }
  };

  return worker;
}
