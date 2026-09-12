"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CaptureRow = {
  id: string;
  merchant: string;
  date: string;
  total: number;
  status: string;
  fileName?: string;
};

function apiBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Wedge API is not configured.");
  return base;
}

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value || 0);
}

function dateFromText(text: string) {
  const iso = text.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.]([0-2]?\d|3[01])\b/);
  if (iso) return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(iso[3]).padStart(2, "0")}`;
  const dmy = text.match(/\b([0-2]?\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/);
  if (dmy) return `${dmy[3]}-${String(dmy[2]).padStart(2, "0")}-${String(dmy[1]).padStart(2, "0")}`;
  return new Date().toISOString().slice(0, 10);
}

function totalFromText(text: string) {
  const candidates = [...text.matchAll(/(?:total|amount\s*due|grand\s*total)[^0-9]{0,20}(?:rm\s*)?([0-9][0-9,]*\.?[0-9]{0,2})/gi)]
    .map((match) => Number(String(match[1]).replace(/,/g, "")))
    .filter((value) => Number.isFinite(value));
  if (candidates.length) return candidates[candidates.length - 1];
  return 0;
}

function merchantFromText(text: string, fallback: string) {
  const first = text.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length >= 2 && line.length <= 120);
  return first || fallback.replace(/\.[a-z0-9]+$/i, "") || "Captured document";
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File could not be read."));
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.readAsDataURL(file);
  });
}

export default function BusinessCapturePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [recent, setRecent] = useState<CaptureRow[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function token() {
    return typeof window === "undefined" ? "" : localStorage.getItem("wc_manager_token") || "";
  }

  async function loadRecent() {
    const response = await fetch(`${apiBase()}/api/business/capture`, { headers: { Authorization: `Bearer ${token()}` } });
    const data = await response.json().catch(() => ({}));
    if (response.status === 401) {
      router.replace("/manager-login");
      return;
    }
    if (response.ok) setRecent(data.captures || []);
  }

  useEffect(() => {
    if (!token()) {
      router.replace("/manager-login");
      return;
    }
    void loadRecent();
    return () => { if (preview) URL.revokeObjectURL(preview); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setOcrText("");
    setOcrConfidence(0);
    setMessage("");
    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setPreview(selected && selected.type.startsWith("image/") ? URL.createObjectURL(selected) : "");
    if (!selected || !selected.type.startsWith("image/")) return;

    setScanning(true);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const result = await worker.recognize(selected);
      await worker.terminate();
      setOcrText(result.data.text || "");
      setOcrConfidence(Number(result.data.confidence || 0));
    } catch (caught) {
      setError(caught instanceof Error ? `The image was selected, but OCR could not finish: ${caught.message}` : "OCR could not finish. You can still upload the document.");
    } finally {
      setScanning(false);
    }
  }

  async function saveCapture() {
    if (!file) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const base64 = await fileToBase64(file);
      const merchant = merchantFromText(ocrText, file.name);
      const total = totalFromText(ocrText);
      const date = dateFromText(ocrText);
      const id = `CAP-${crypto.randomUUID()}`;
      const response = await fetch(`${apiBase()}/api/business/capture`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          base64,
          document: {
            id,
            merchant,
            date,
            documentNo: "",
            documentType: "purchase",
            items: [{
              id: `${id}-1`,
              description: ocrText.trim().slice(0, 500) || "Captured document pending bookkeeping review",
              quantity: 1,
              unit: "document",
              unitPrice: total,
              amount: total,
              category: "Needs Review",
              confidence: Math.round(ocrConfidence),
              descriptionConfirmed: false,
              source: "review",
            }],
            tax: 0,
            total,
            status: "Needs review",
            fileName: file.name,
            ocrConfidence,
            ocrText,
            createdAt: new Date().toISOString(),
          },
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        router.replace("/manager-login");
        return;
      }
      if (!response.ok) throw new Error(data?.message || "Document could not be captured.");
      setMessage("Captured. The document is now in WedgeBooks for bookkeeping review.");
      setFile(null);
      setOcrText("");
      setOcrConfidence(0);
      if (preview) URL.revokeObjectURL(preview);
      setPreview("");
      await loadRecent();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Document could not be captured.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-5 py-8 text-[#20282c] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/business" className="text-sm font-bold text-[#8b692f]">← Business Home</Link><span className="text-xs font-bold tracking-[.16em] text-[#9b7639]">WEDGEBOOKS CAPTURE</span></div>

        <section className="mt-6 rounded-[30px] border border-[#d8d0c2] bg-white p-6 shadow-[0_24px_70px_rgba(32,40,44,.06)] sm:p-8">
          <h1 className="font-serif text-4xl">Scan receipt / invoice</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667074]">Take a photo or upload a file. Image OCR runs on your device first, then the source file and extracted details are sent to WedgeBooks for review. You do not need to choose accounting codes.</p>

          <label className="mt-7 block cursor-pointer rounded-[24px] border-2 border-dashed border-[#b99152]/35 bg-[#fffaf1] p-7 text-center">
            <span className="text-4xl">📷</span>
            <span className="mt-3 block text-xl font-bold">Take photo or choose file</span>
            <span className="mt-2 block text-xs text-[#667074]">JPG / PNG / WEBP / PDF · up to backend capture limit</span>
            <input type="file" accept="image/*,.pdf,application/pdf" capture="environment" onChange={selectFile} className="hidden" />
          </label>

          {file ? <div className="mt-5 rounded-2xl border border-[#20282c]/10 bg-[#faf8f3] p-5"><p className="font-bold">{file.name}</p><p className="mt-1 text-xs text-[#667074]">{scanning ? "Reading image…" : ocrText ? `OCR ready · ${Math.round(ocrConfidence)}% confidence` : "File ready for capture"}</p>{preview ? <img src={preview} alt="Selected document" className="mt-4 max-h-80 w-full rounded-xl object-contain" /> : null}{ocrText ? <details className="mt-4"><summary className="cursor-pointer text-sm font-bold text-[#8b692f]">View text read from image</summary><pre className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-4 text-xs text-[#667074]">{ocrText}</pre></details> : null}<button onClick={() => void saveCapture()} disabled={saving || scanning} className="mt-5 w-full rounded-xl bg-[#20282c] px-5 py-4 font-bold text-white disabled:opacity-50">{saving ? "Sending to WedgeBooks…" : scanning ? "Reading image…" : "Send to WedgeBooks"}</button></div> : null}

          {message ? <p className="mt-5 rounded-xl border border-emerald-700/15 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p> : null}
          {error ? <p className="mt-5 rounded-xl border border-amber-700/15 bg-amber-50 p-4 text-sm text-amber-900">{error}</p> : null}
        </section>

        <section className="mt-6 rounded-[26px] border border-[#d8d0c2] bg-white p-6">
          <h2 className="text-xl font-bold">Recent captures</h2>
          <div className="mt-4 space-y-3">
            {recent.map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#20282c]/10 bg-[#faf8f3] p-4"><div><p className="font-semibold">{row.merchant || row.fileName || "Captured document"}</p><p className="mt-1 text-xs text-[#667074]">{row.date} · {row.status}</p></div><b>{money(row.total)}</b></div>)}
            {!recent.length ? <p className="text-sm text-[#667074]">No captures yet.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}
