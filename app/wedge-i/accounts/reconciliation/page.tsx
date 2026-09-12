"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";

import {
  loadMonthlyAccountFile,
  saveManagedReconciliation,
  uploadBankStatementMetadata,
} from "../service";
import type { MonthlyAccountFile } from "../types";

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#0d1316] px-4 py-3 text-white outline-none focus:border-[#c8a467]";

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value);
}

function monthName(month: number, year: number) {
  return new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

export default function ReconciliationWorkspacePage() {
  const now = new Date();
  const [businessId, setBusinessId] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [file, setFile] = useState<MonthlyAccountFile | null>(null);
  const [difference, setDifference] = useState("0");
  const [exceptions, setExceptions] = useState("0");
  const [statement, setStatement] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setBusinessId(new URLSearchParams(window.location.search).get("businessId") || "");
  }, []);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    async function load() {
      setBusy(true); setError("");
      try {
        const result = await loadMonthlyAccountFile(businessId, year, month);
        if (cancelled) return;
        setFile(result.file);
        setDifference(String(result.file.reconciliationDifference || 0));
        setExceptions(String(result.file.bankExceptionCount || 0));
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Monthly reconciliation could not be loaded.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [businessId, year, month]);

  function pickStatement(event: ChangeEvent<HTMLInputElement>) {
    setStatement(event.target.files?.[0] || null);
    setMessage("");
  }

  async function recordStatement() {
    if (!businessId || !statement) return;
    setUploading(true); setError(""); setMessage("");
    try {
      await uploadBankStatementMetadata(businessId, year, month, {
        bankAccountId: "",
        fileName: statement.name,
        mimeType: statement.type || "application/octet-stream",
      });
      const refreshed = await loadMonthlyAccountFile(businessId, year, month);
      setFile(refreshed.file);
      setStatement(null);
      setMessage("Statement recorded for this month. Reconciliation can now be worked and exceptions updated below.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Statement could not be recorded.");
    } finally { setUploading(false); }
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!businessId) return;
    const parsedDifference = Number(difference);
    const parsedExceptions = Number(exceptions);
    if (!Number.isFinite(parsedDifference) || !Number.isFinite(parsedExceptions) || parsedExceptions < 0) {
      setError("Enter a valid bank difference and unresolved exception count.");
      return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await saveManagedReconciliation(businessId, year, month, {
        reconciliationDifference: parsedDifference,
        bankExceptionCount: Math.floor(parsedExceptions),
      });
      setFile(result.file);
      setMessage(result.file.bankReconciliation === "reconciled" ? "Reconciliation complete: RM0 difference and no unresolved exceptions." : "Reconciliation status saved. Resolve the remaining difference or exceptions before month close.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reconciliation status could not be saved.");
    } finally { setBusy(false); }
  }

  if (!businessId) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#090d10] px-6 text-center text-[#f4efe6]">
        <section className="max-w-xl rounded-[28px] border border-white/10 bg-[#11171b] p-8">
          <h1 className="text-3xl font-semibold text-[#f0dfbd]">Select a managed business first</h1>
          <p className="mt-4 text-sm leading-6 text-white/45">Reconciliation is stored against a canonical Business ID and month. No sample transactions are shown.</p>
          <Link href="/wedge-i/accounts" className="mt-6 inline-flex rounded-full bg-[#c8a467] px-6 py-3 font-bold text-[#111416]">Open Accounts Control</Link>
        </section>
      </main>
    );
  }

  const reconciled = file?.bankReconciliation === "reconciled" || file?.bankReconciliation === "closed";
  const locked = Boolean(file?.lockedAt);

  return (
    <main className="min-h-screen bg-[#090d10] px-5 py-8 text-[#f4efe6] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/wedge-i/accounts" className="text-sm font-medium text-[#c8a467]">← Accounts Control Centre</Link>
          <Link href={`/wedge-i/accounts/pnl?businessId=${encodeURIComponent(businessId)}`} className="rounded-full border border-white/10 px-5 py-2 text-xs font-bold text-white/60">P&amp;L Workspace</Link>
        </div>

        <header className="mt-6 border-b border-white/10 pb-7">
          <p className="text-xs font-semibold tracking-[0.22em] text-[#c8a467]">BANK RECONCILIATION</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#f1dfbc]">{monthName(month, year)}</h1>
          <p className="mt-3 text-sm text-white/45">Business ID {businessId}. Only actual month status is displayed; transaction matching detail will appear when statement parsing/matching is available.</p>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Status" value={(file?.bankReconciliation || "loading").replaceAll("_", " ")} />
          <Metric label="Difference" value={money(Number(file?.reconciliationDifference || 0))} />
          <Metric label="Unresolved exceptions" value={String(file?.bankExceptionCount || 0)} />
          <Metric label="Missing documents" value={String(file?.missingDocumentCount || 0)} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-[#11171b] p-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">BANK STATEMENT</p>
            <h2 className="mt-2 text-xl font-semibold text-[#f1dfbc]">Record the month statement</h2>
            <p className="mt-3 text-xs leading-5 text-white/40">Wedge stores the statement reference for the managed workflow here. Never enter bank login credentials, PINs or TAC codes.</p>
            <input disabled={locked} onChange={pickStatement} type="file" accept=".csv,.xlsx,.xls,.pdf,text/csv,application/pdf" className="mt-5 block w-full rounded-xl border border-dashed border-white/15 bg-white/[.03] p-4 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-[#c8a467] file:px-4 file:py-2 file:font-bold file:text-[#111416]" />
            {statement ? <p className="mt-3 text-xs text-white/45">Selected: {statement.name}</p> : null}
            <button type="button" disabled={!statement || uploading || locked} onClick={() => void recordStatement()} className="mt-5 w-full rounded-xl border border-[#c8a467]/30 px-5 py-3 text-sm font-bold text-[#ead3a8] disabled:opacity-40">{uploading ? "Recording…" : "Record Statement"}</button>
          </div>

          <form onSubmit={save} className="rounded-[28px] border border-white/10 bg-[#11171b] p-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">RECONCILIATION CONTROL</p>
            <h2 className="mt-2 text-xl font-semibold text-[#f1dfbc]">Exception summary</h2>
            <p className="mt-3 text-xs leading-5 text-white/40">Update these values only after reviewing the actual bank statement against WedgeBooks and clearing records.</p>
            <label className="mt-5 block text-sm text-white/60">Bank difference (RM)
              <input disabled={locked} type="number" step="0.01" value={difference} onChange={(event) => setDifference(event.target.value)} className={inputClass} />
            </label>
            <label className="mt-4 block text-sm text-white/60">Unresolved exceptions
              <input disabled={locked} type="number" min="0" step="1" value={exceptions} onChange={(event) => setExceptions(event.target.value)} className={inputClass} />
            </label>
            <button disabled={busy || locked} className="mt-5 w-full rounded-xl bg-[#c8a467] px-5 py-3 font-bold text-[#111416] disabled:opacity-40">{busy ? "Saving…" : "Save Reconciliation Status"}</button>
          </form>
        </section>

        {error ? <p className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">{error}</p> : null}
        {message ? <p className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{message}</p> : null}

        <section className="mt-7 rounded-[26px] border border-[#c8a467]/20 bg-[#12181c] p-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">MONTH CLOSE GATE</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Check ok={reconciled} label="Bank difference = RM0" />
            <Check ok={(file?.bankExceptionCount || 0) === 0} label="Bank exceptions = 0" />
            <Check ok={(file?.missingDocumentCount || 0) === 0} label="Missing documents = 0" />
            <Check ok={file?.pnl === "review_required" || file?.pnl === "complete"} label="P&L draft saved" />
          </div>
          <p className="mt-5 text-xs leading-5 text-white/40">Final month close is performed from the P&amp;L Workspace. The backend enforces these gates and will not publish a client P&amp;L until reconciliation is complete.</p>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#11171b]/90 p-5"><p className="text-xs uppercase tracking-[0.14em] text-white/35">{label}</p><div className="mt-3 text-xl font-semibold capitalize text-[#f1dfbc]">{value}</div></div>;
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/55"><span className={ok ? "text-emerald-300" : "text-amber-200"}>{ok ? "✓" : "!"}</span><span>{label}</span></div>;
}
