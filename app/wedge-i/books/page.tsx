"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import "./books.css";
import { accountingDeskImage, receiptIsolationImage } from "./images";
import {
  allCategories,
  BookCategory,
  BookDocument,
  businessProfiles,
  BusinessType,
  DocumentType,
  inferDocumentType,
  LearningMap,
  merchantNotVisible,
  normalise,
  parseBookDocument,
} from "./brain";

type OcrLanguage = "eng+msa" | "eng+chi_sim" | "eng+tam";
type Screen = "dashboard" | "documents" | "brain" | "exports";

type BusinessSetup = {
  name: string;
  type: BusinessType;
  ocrLanguage: OcrLanguage;
};

const emptyDocument: BookDocument = {
  id: "",
  merchant: "",
  date: "",
  documentNo: "",
  documentType: "purchase",
  items: [],
  tax: 0,
  total: 0,
  status: "Needs review",
  createdAt: "",
};

const sampleText = `KEEN TAT SUPPLIES
INVOICE NO: KT-260718
DATE: 18/07/2026
Plastic food container 4 box 80.00
TNB electricity bill 245.60
Shop rental July 1,500.00
TOTAL RM 1,825.60`;

function money(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
  }).format(value);
}

function csvEscape(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function downloadBlob(contents: BlobPart, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function documentRows(documents: BookDocument[]) {
  return documents.flatMap((document) =>
    document.items.map((item) => ({
      date: document.date,
      documentType: document.documentType,
      documentNo: document.documentNo,
      merchant: document.merchant,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      amount: item.amount,
      category: item.category,
      confidence: item.confidence,
      tax: document.tax,
      documentTotal: document.total,
    })),
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [setup, setSetup] = useState<BusinessSetup | null>(null);
  const [setupDraft, setSetupDraft] = useState<BusinessSetup>({
    name: "",
    type: "restaurant",
    ocrLanguage: "eng+msa",
  });
  const [documents, setDocuments] = useState<BookDocument[]>([]);
  const [learning, setLearning] = useState<LearningMap>({});
  const [draft, setDraft] = useState<BookDocument>(emptyDocument);
  const [documentType, setDocumentType] = useState<DocumentType>("purchase");
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [receiptText, setReceiptText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStage, setOcrStage] = useState("");
  const [message, setMessage] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedSetup = localStorage.getItem("wedgebooks.setup");
      const savedDocuments = localStorage.getItem("wedgebooks.documents");
      const savedLegacy = localStorage.getItem("wedgebooks.receipts");
      const savedLearning = localStorage.getItem("wedgebooks.learning");
      if (savedSetup) setSetup(JSON.parse(savedSetup));
      if (savedDocuments) setDocuments(JSON.parse(savedDocuments));
      else if (savedLegacy) setDocuments(JSON.parse(savedLegacy));
      if (savedLearning) setLearning(JSON.parse(savedLearning));
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (setup) localStorage.setItem("wedgebooks.setup", JSON.stringify(setup));
    localStorage.setItem("wedgebooks.documents", JSON.stringify(documents));
    localStorage.setItem("wedgebooks.learning", JSON.stringify(learning));
  }, [setup, documents, learning, hydrated]);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const totalSales = useMemo(
    () => documents.filter((doc) => doc.documentType === "sales").reduce((sum, doc) => sum + doc.total, 0),
    [documents],
  );
  const totalPurchases = useMemo(
    () => documents.filter((doc) => doc.documentType === "purchase").reduce((sum, doc) => sum + doc.total, 0),
    [documents],
  );
  const needsReview = documents.filter((doc) => doc.status === "Needs review").length;
  const categoryTotals = useMemo(() => {
    const totals: Partial<Record<BookCategory, number>> = {};
    documents.forEach((doc) =>
      doc.items.forEach((item) => {
        totals[item.category] = (totals[item.category] ?? 0) + item.amount;
      }),
    );
    return totals;
  }, [documents]);
  const merchantNeedsUpdate =
    !!draft.items.length &&
    (!draft.merchant.trim() || draft.merchant.trim() === merchantNotVisible);

  function saveSetup() {
    if (!setupDraft.name.trim()) return;
    setSetup({ ...setupDraft, name: setupDraft.name.trim() });
    setMessage("Business profile saved. The brain will use this context for every document.");
  }

  function chooseFile(selected?: File) {
    if (!selected) return;
    if (!selected.type.startsWith("image/") && !selected.type.startsWith("text/") && !selected.name.endsWith(".txt")) {
      setMessage("Please upload a clear JPG, PNG, WEBP or TXT file. PDF reading will be added separately.");
      return;
    }
    setFile(selected);
    setDraft(emptyDocument);
    setReceiptText("");
    setMessage("");
    setOcrProgress(0);
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFileUrl(selected.type.startsWith("image/") ? URL.createObjectURL(selected) : "");
    if (selected.type.startsWith("text/") || selected.name.endsWith(".txt")) {
      selected.text().then(setReceiptText);
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    chooseFile(event.target.files?.[0]);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0]);
  }

  async function readDocument(useSample = false) {
    if (!setup) return;
    setScanning(true);
    setMessage("");
    setOcrProgress(0);
    setOcrStage(useSample ? "Loading sample" : "Preparing document");

    try {
      let source = useSample ? sampleText : receiptText.trim();
      let confidence: number | undefined;

      if (!source && file?.type.startsWith("image/")) {
        const { createWorker } = await import("tesseract.js");
        const languages = setup.ocrLanguage.split("+");
        const worker = await createWorker(languages, 1, {
          logger: (status) => {
            if (typeof status.progress === "number") {
              setOcrProgress(Math.round(status.progress * 100));
            }
            if (status.status) {
              setOcrStage(
                status.status === "recognizing text"
                  ? "Reading characters"
                  : status.status.replace(/(^\w|\s\w)/g, (letter) => letter.toUpperCase()),
              );
            }
          },
        });
        const result = await worker.recognize(file);
        source = result.data.text.trim();
        confidence = result.data.confidence;
        await worker.terminate();
      }

      if (!source) {
        throw new Error("No readable text was found. Use a clearer, straight receipt photo.");
      }

      const detectedType = inferDocumentType(source);
      const chosenType = documentType || detectedType;
      setDocumentType(chosenType);
      setReceiptText(source);
      setDraft(
        parseBookDocument({
          text: source,
          businessType: setup.type,
          documentType: chosenType,
          learning,
          fileName: file?.name,
          ocrConfidence: confidence,
        }),
      );
      setOcrProgress(100);
      setOcrStage("Document read");
    } catch (error) {
      const details = error instanceof Error ? error.message : "The document could not be read.";
      setMessage(details);
      setOcrStage("Reading failed");
    } finally {
      setScanning(false);
    }
  }

  function reclassifyDocument(nextType: DocumentType) {
    setDocumentType(nextType);
    if (!setup || !receiptText.trim()) return;
    setDraft(
      parseBookDocument({
        text: receiptText,
        businessType: setup.type,
        documentType: nextType,
        learning,
        fileName: file?.name,
        ocrConfidence: draft.ocrConfidence,
      }),
    );
  }

  function updateItemCategory(itemId: string, category: BookCategory) {
    setDraft((current) => {
      const items = current.items.map((item) =>
        item.id === itemId
          ? { ...item, category, confidence: 100, source: "learned" as const }
          : item,
      );
      return {
        ...current,
        items,
        status: items.every((item) => item.confidence >= 70 && item.category !== "Needs Review")
          ? "Ready"
          : "Needs review",
      };
    });
  }

  function saveDocument() {
    if (!draft.items.length) return;
    if (merchantNeedsUpdate) {
      setMessage("Merchant not visible. Please enter the merchant name before saving.");
      return;
    }
    const additions: LearningMap = {};
    draft.items.forEach((item) => {
      if (item.source === "learned") additions[normalise(item.description)] = item.category;
    });
    setLearning((current) => ({ ...current, ...additions }));
    setDocuments((current) => [draft, ...current.filter((document) => document.id !== draft.id)]);
    setMessage(
      `Saved ${draft.items.length} line item${draft.items.length === 1 ? "" : "s"}. ` +
      `The brain learned ${Object.keys(additions).length} correction${Object.keys(additions).length === 1 ? "" : "s"}.`,
    );
    setDraft(emptyDocument);
    setFile(null);
    setFileUrl("");
    setReceiptText("");
    setOcrProgress(0);
    setOcrStage("");
  }

  function loadSample() {
    if (!setup) return;
    setScreen("documents");
    setFile(null);
    setFileUrl("");
    setReceiptText(sampleText);
    setDocumentType("purchase");
    setMessage("");
    void readDocument(true);
  }

  function exportCsv() {
    const rows = documentRows(documents);
    const headers = [
      "Date", "Type", "Document No", "Merchant", "Description", "Quantity", "Unit",
      "Unit Price (RM)", "Amount (RM)", "Bookkeeping Category", "Confidence %",
      "Tax (RM)", "Document Total (RM)",
    ];
    const body = rows.map((row) =>
      [
        row.date, row.documentType, row.documentNo, row.merchant, row.description,
        row.quantity, row.unit, row.unitPrice.toFixed(2), row.amount.toFixed(2),
        row.category, row.confidence, row.tax.toFixed(2), row.documentTotal.toFixed(2),
      ].map(csvEscape).join(","),
    );
    downloadBlob(
      `\uFEFF${headers.map(csvEscape).join(",")}\n${body.join("\n")}`,
      "wedgebooks-bookkeeping.csv",
      "text/csv;charset=utf-8",
    );
  }

  function exportExcel() {
    const rows = documentRows(documents);
    const columns = [
      ["Date", "date"], ["Type", "documentType"], ["Document No", "documentNo"],
      ["Merchant", "merchant"], ["Description", "description"], ["Quantity", "quantity"],
      ["Unit", "unit"], ["Unit Price (RM)", "unitPrice"], ["Amount (RM)", "amount"],
      ["Bookkeeping Category", "category"], ["Confidence %", "confidence"],
      ["Tax (RM)", "tax"], ["Document Total (RM)", "documentTotal"],
    ] as const;
    const escapeXml = (value: unknown) =>
      String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const heading = columns
      .map(([name]) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${name}</Data></Cell>`)
      .join("");
    const rowXml = rows.map((row) =>
      `<Row>${columns.map(([, key]) => {
        const value = row[key];
        return `<Cell><Data ss:Type="${typeof value === "number" ? "Number" : "String"}">${escapeXml(value)}</Data></Cell>`;
      }).join("")}</Row>`,
    ).join("");
    const workbook = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#DDF4EB" ss:Pattern="Solid"/></Style></Styles>
<Worksheet ss:Name="Bookkeeping"><Table><Row>${heading}</Row>${rowXml}</Table></Worksheet></Workbook>`;
    downloadBlob(workbook, "wedgebooks-bookkeeping.xls", "application/vnd.ms-excel");
  }

  if (!hydrated) {
    return <main className="wedgebooks loading-screen"><div className="brain-orbit">W</div><p>Opening WedgeBooks…</p></main>;
  }

  if (!setup) {
    return (
      <main
        className="wedgebooks setup-screen"
        style={{
          backgroundImage: `linear-gradient(115deg, rgba(7, 32, 24, .94), rgba(13, 67, 48, .82)), url(${receiptIsolationImage})`,
        }}
      >
        <section className="setup-card">
          <div className="setup-brand">
            <div className="brand-mark">W</div><span>WEDGE‑WORKS</span>
            <div className="setup-links"><Link href="/wedge-i">Wedge‑I</Link><Link className="active" href="/wedge-i/books">WedgeBooks</Link></div>
          </div>
          <div className="setup-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={accountingDeskImage} alt="Organised bookkeeping desk with receipts, invoices and accounting dashboard" />
          </div>
          <p className="eyebrow">WEDGEBOOKS · FIRST SETUP</p>
          <h1>What kind of business<br />are we bookkeeping?</h1>
          <p className="setup-copy">
            This gives the brain context. It will understand the same invoice differently for a restaurant,
            retailer, salon or factory.
          </p>
          <label className="field-label">
            Business name
            <input
              value={setupDraft.name}
              onChange={(event) => setSetupDraft({ ...setupDraft, name: event.target.value })}
              placeholder="Example: John's Café"
            />
          </label>
          <div className="business-grid">
            {(Object.entries(businessProfiles) as Array<[BusinessType, (typeof businessProfiles)[BusinessType]]>)
              .map(([key, profile]) => (
                <button
                  key={key}
                  className={setupDraft.type === key ? "selected" : ""}
                  onClick={() => setSetupDraft({ ...setupDraft, type: key })}
                >
                  <span>{profile.label}</span>
                  <small>{profile.description}</small>
                </button>
              ))}
          </div>
          <label className="field-label">
            Main document language
            <select
              value={setupDraft.ocrLanguage}
              onChange={(event) =>
                setSetupDraft({ ...setupDraft, ocrLanguage: event.target.value as OcrLanguage })
              }
            >
              <option value="eng+msa">English + Bahasa Malaysia</option>
              <option value="eng+chi_sim">English + 中文</option>
              <option value="eng+tam">English + தமிழ்</option>
            </select>
          </label>
          <button className="primary full setup-submit" disabled={!setupDraft.name.trim()} onClick={saveSetup}>
            Start bookkeeping
          </button>
          <p className="privacy-note">You can change this profile later.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="wedgebooks app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">W</div>
          <div><strong>WedgeBooks</strong><span>inside Wedge‑Works</span></div>
        </div>
        <div className="business-chip">
          <strong>{setup.name}</strong>
          <span>{businessProfiles[setup.type].label}</span>
        </div>
        <nav aria-label="Main navigation">
          <button className={screen === "dashboard" ? "active" : ""} onClick={() => setScreen("dashboard")}>
            <span className="nav-icon">⌂</span> Dashboard
          </button>
          <button className={screen === "documents" ? "active" : ""} onClick={() => setScreen("documents")}>
            <span className="nav-icon">▤</span> Documents
          </button>
          <button className={screen === "brain" ? "active" : ""} onClick={() => setScreen("brain")}>
            <span className="nav-icon">⌘</span> Brain memory
          </button>
          <button className={screen === "exports" ? "active" : ""} onClick={() => setScreen("exports")}>
            <span className="nav-icon">↓</span> Exports
          </button>
        </nav>
        <button
          className="change-business"
          onClick={() => {
            setSetupDraft(setup);
            setSetup(null);
          }}
        >
          Change business profile
        </button>
        <div className="brain-status">
          <div className="pulse-dot" />
          <div><strong>Wedge Brain active</strong><span>{Object.keys(learning).length} learned rules</span></div>
        </div>
      </aside>

      <main className="main">
        <div className="module-switcher" aria-label="Wedge intelligence tools">
          <Link href="/">Wedge‑Works</Link>
          <Link href="/wedge-i">Wedge‑I</Link>
          <Link className="active" href="/wedge-i/books">WedgeBooks</Link>
        </div>
        <header className="topbar">
          <div>
            <p className="eyebrow">WEDGEBOOKS · PURE BOOKKEEPING</p>
            <h1>
              {screen === "dashboard" && `Hello, ${setup.name}`}
              {screen === "documents" && "Receipt & invoice isolation"}
              {screen === "brain" && "Wedge Brain memory"}
              {screen === "exports" && "Bookkeeping exports"}
            </h1>
          </div>
          <button className="primary compact" onClick={() => setScreen("documents")}>+ Add document</button>
        </header>

        {message && <div className="notice">{message}<button onClick={() => setMessage("")}>×</button></div>}

        {screen === "dashboard" && (
          <>
            <section className="hero">
              <div>
                <span className="hero-tag">PHASE 1 · INVOICES & RECEIPTS ONLY</span>
                <h2>Every document,<br />properly isolated.</h2>
                <p>The eye reads the real image. The brain separates sales, direct purchases, overheads and assets.</p>
                <div className="hero-actions">
                  <button className="primary" onClick={() => setScreen("documents")}>Upload document</button>
                  <button className="secondary" onClick={loadSample}>Try bookkeeping sample</button>
                </div>
              </div>
              <div className="hero-visual">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={accountingDeskImage} alt="Bookkeeping workspace with invoices, receipts and accounting dashboard" />
                <div className="hero-steps">
                  <span>Business context</span><i>→</i><span>Actual OCR</span><i>→</i><span>Isolation</span>
                </div>
              </div>
            </section>
            <section className="stats">
              <article><span>Sales documents</span><strong>{money(totalSales)}</strong><small>Recorded sales receipts</small></article>
              <article><span>Purchase documents</span><strong>{money(totalPurchases)}</strong><small>Purchases and expenses</small></article>
              <article><span>Needs review</span><strong>{needsReview}</strong><small>Only uncertain documents</small></article>
            </section>
            <section className="accounting-story">
              <div>
                <p className="eyebrow">BUILT FOR CLEAN BOOKS</p>
                <h3>Receipts in. Proper categories out.</h3>
                <p>Utilities, rent, goods, sales and direct purchases are separated line by line—ready for Excel or CSV.</p>
                <button className="primary" onClick={() => setScreen("documents")}>Process a document</button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={receiptIsolationImage} alt="Receipts organised into bookkeeping categories" />
            </section>
            <section className="panel">
              <div className="panel-heading">
                <div><p className="eyebrow">RECENT BOOKKEEPING</p><h3>Processed documents</h3></div>
                {!!documents.length && <button className="text-button" onClick={() => setScreen("exports")}>Export books →</button>}
              </div>
              {!documents.length ? (
                <div className="empty">
                  <div className="empty-icon">▤</div>
                  <h4>No documents recorded</h4>
                  <p>Upload the first real receipt or invoice.</p>
                  <button className="secondary" onClick={() => setScreen("documents")}>Add document</button>
                </div>
              ) : (
                <div className="document-list">
                  {documents.slice(0, 8).map((document) => (
                    <button key={document.id} onClick={() => { setDraft(document); setScreen("documents"); }}>
                      <div className="document-logo">{document.merchant.charAt(0)}</div>
                      <div><strong>{document.merchant}</strong><span>{document.date} · {document.items.length} lines</span></div>
                      <em className={document.documentType}>{document.documentType}</em>
                      <b>{money(document.total)}</b>
                      <i className={document.status === "Ready" ? "ready" : "review"}>{document.status}</i>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {screen === "documents" && (
          <section className="document-workspace">
            <div className="upload-column">
              <div className="panel-heading">
                <div><p className="eyebrow">STEP 1 · AI EYE</p><h3>Read the actual document</h3></div>
                <button className="text-button" onClick={loadSample}>Use sample</button>
              </div>
              <div className="type-toggle" aria-label="Document type">
                <button className={documentType === "purchase" ? "active" : ""} onClick={() => reclassifyDocument("purchase")}>
                  Purchase / expense
                </button>
                <button className={documentType === "sales" ? "active" : ""} onClick={() => reclassifyDocument("sales")}>
                  Sales receipt
                </button>
              </div>
              <div
                className={`dropzone ${dragging ? "dragging" : ""}`}
                onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
              >
                {fileUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={fileUrl} alt="Uploaded document preview" />
                ) : (
                  <>
                    <div className="upload-icon">↑</div>
                    <h4>{file ? file.name : "Drop receipt or invoice here"}</h4>
                    <p>Clear JPG, PNG or WEBP image</p>
                    <label className="secondary file-button">
                      Choose image
                      <input type="file" accept="image/jpeg,image/png,image/webp,.txt,text/plain" onChange={onFileChange} />
                    </label>
                  </>
                )}
              </div>
              {file && (
                <div className="file-row">
                  <span>{file.name}</span>
                  <button onClick={() => { setFile(null); setFileUrl(""); setReceiptText(""); }}>Remove</button>
                </div>
              )}
              {scanning && (
                <div className="ocr-progress">
                  <div><span>{ocrStage}</span><strong>{ocrProgress}%</strong></div>
                  <div className="progress-track"><i style={{ width: `${ocrProgress}%` }} /></div>
                  <small>First use may take longer while language recognition loads.</small>
                </div>
              )}
              <button
                className="primary full read-button"
                disabled={scanning || (!file && !receiptText.trim())}
                onClick={() => void readDocument()}
              >
                {scanning ? "Reading the actual image…" : "Read & isolate document"}
              </button>
              {!!receiptText && (
                <details className="ocr-details">
                  <summary>View text read by the AI Eye</summary>
                  <textarea value={receiptText} onChange={(event) => setReceiptText(event.target.value)} />
                  <button className="secondary full" onClick={() => void readDocument()}>Reprocess corrected text</button>
                </details>
              )}
              <p className="privacy-note">OCR runs on this device. The image is not stored by WedgeBooks.</p>
            </div>

            <div className="review-column">
              <div className="panel-heading">
                <div><p className="eyebrow">STEP 2 · WEDGE BRAIN</p><h3>Isolated bookkeeping lines</h3></div>
                {!!draft.items.length && <span className={`status-pill ${draft.status === "Ready" ? "ready" : "review"}`}>{draft.status}</span>}
              </div>
              {!draft.items.length ? (
                <div className="empty tall">
                  <div className="brain-orbit">W</div>
                  <h4>Waiting for a real document</h4>
                  <p>Upload an image. No sample information will be substituted.</p>
                </div>
              ) : (
                <>
                  <div className={`document-meta ${merchantNeedsUpdate ? "merchant-review" : ""}`}>
                    <label>
                      Merchant
                      <input
                        aria-invalid={merchantNeedsUpdate}
                        value={draft.merchant}
                        onFocus={(event) => {
                          if (event.currentTarget.value === merchantNotVisible) {
                            setDraft({ ...draft, merchant: "" });
                          }
                        }}
                        onChange={(event) => {
                          const merchant = event.target.value;
                          setDraft({
                            ...draft,
                            merchant,
                            status:
                              merchant.trim() &&
                              draft.items.every((item) => item.confidence >= 70 && item.category !== "Needs Review") &&
                              (draft.ocrConfidence ?? 100) >= 45
                                ? "Ready"
                                : "Needs review",
                          });
                        }}
                        placeholder="Enter merchant name"
                      />
                    </label>
                    <label>Date<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label>
                    <label>Document no.<input value={draft.documentNo} onChange={(event) => setDraft({ ...draft, documentNo: event.target.value })} /></label>
                  </div>
                  {merchantNeedsUpdate && (
                    <div className="merchant-warning" role="alert">
                      <strong>Merchant not visible</strong>
                      <span>Please enter or update the merchant name above before saving.</span>
                    </div>
                  )}
                  {typeof draft.ocrConfidence === "number" && (
                    <div className="ocr-score">
                      <span>Image reading confidence</span>
                      <strong>{Math.round(draft.ocrConfidence)}%</strong>
                    </div>
                  )}
                  <div className="items-table-wrap">
                    <table>
                      <thead><tr><th>Line read</th><th>Amount</th><th>Bookkeeping isolation</th><th>Confidence</th></tr></thead>
                      <tbody>
                        {draft.items.map((item) => (
                          <tr key={item.id}>
                            <td><strong>{item.description}</strong><span>{item.quantity} {item.unit}</span></td>
                            <td>{money(item.amount)}</td>
                            <td>
                              <select value={item.category} onChange={(event) => updateItemCategory(item.id, event.target.value as BookCategory)}>
                                {allCategories.map((category) => <option key={category}>{category}</option>)}
                              </select>
                            </td>
                            <td><span className={`confidence ${item.confidence >= 70 ? "high" : "low"}`}>{item.confidence}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="document-total"><span>Document total</span><strong>{money(draft.total)}</strong></div>
                  <div className="save-row">
                    <span>
                      {merchantNeedsUpdate
                        ? "Merchant name is required before this document can be saved."
                        : "Correct a category once; the brain remembers it."}
                    </span>
                    <button className="primary" disabled={merchantNeedsUpdate} onClick={saveDocument}>Confirm & save</button>
                  </div>
                </>
              )}
            </div>
          </section>
        )}

        {screen === "brain" && (
          <section className="panel">
            <div className="panel-heading">
              <div><p className="eyebrow">BUSINESS-AWARE CLASSIFICATION</p><h3>What the brain currently knows</h3></div>
              <span className="status-pill ready">{Object.keys(learning).length} learned</span>
            </div>
            <div className="brain-summary">
              <article><span>Business context</span><strong>{businessProfiles[setup.type].label}</strong><p>Unknown direct purchases default to {businessProfiles[setup.type].directCategory}.</p></article>
              <article><span>Universal overheads</span><strong>Separated first</strong><p>Utilities, rent, repairs, transport, administration, assets and professional fees.</p></article>
              <article><span>Corrections</span><strong>{Object.keys(learning).length} remembered</strong><p>Your confirmed descriptions override general business rules.</p></article>
            </div>
            <div className="memory-table">
              <div className="memory-heading"><span>Description learned</span><span>Bookkeeping category</span></div>
              {Object.entries(learning).map(([term, category]) => (
                <div key={term}><span>{term}</span><strong>{category}</strong></div>
              ))}
              {!Object.keys(learning).length && <div className="empty compact-empty"><p>No corrections yet. The brain starts with business context and overhead concepts.</p></div>}
            </div>
          </section>
        )}

        {screen === "exports" && (
          <section className="exports-grid">
            <article className="export-hero">
              <p className="eyebrow">CLEAN BOOKKEEPING OUTPUT</p>
              <h2>Documents isolated.<br />Books ready.</h2>
              <p>Every recorded line includes its source document, merchant, amount, category and confidence.</p>
              <div className="export-actions">
                <button className="primary" disabled={!documents.length} onClick={exportExcel}>Download Excel</button>
                <button className="secondary" disabled={!documents.length} onClick={exportCsv}>Download CSV</button>
              </div>
            </article>
            <article className="panel export-summary">
              <div className="panel-heading"><div><p className="eyebrow">CURRENT BOOK</p><h3>Export summary</h3></div></div>
              <dl>
                <div><dt>Documents</dt><dd>{documents.length}</dd></div>
                <div><dt>Bookkeeping lines</dt><dd>{documentRows(documents).length}</dd></div>
                <div><dt>Sales recorded</dt><dd>{money(totalSales)}</dd></div>
                <div><dt>Purchases recorded</dt><dd>{money(totalPurchases)}</dd></div>
              </dl>
            </article>
            <article className="panel full-span">
              <div className="panel-heading"><div><p className="eyebrow">ISOLATION SUMMARY</p><h3>Where each amount belongs</h3></div></div>
              <div className="summary-bars">
                {Object.entries(categoryTotals).sort(([, a], [, b]) => b - a).map(([category, total]) => (
                  <div key={category}>
                    <span>{category}</span>
                    <div><i style={{ width: `${Math.max(3, totalPurchases + totalSales ? total / (totalPurchases + totalSales) * 100 : 0)}%` }} /></div>
                    <strong>{money(total)}</strong>
                  </div>
                ))}
                {!documents.length && <div className="empty compact-empty"><p>No bookkeeping data yet.</p></div>}
              </div>
            </article>
          </section>
        )}

        <footer><span>WedgeBooks · Wedge‑Works</span><span>Business context → Actual OCR → Bookkeeping isolation</span></footer>
      </main>
    </div>
  );
}
