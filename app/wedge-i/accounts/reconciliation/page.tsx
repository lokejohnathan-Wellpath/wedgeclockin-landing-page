"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import {
  addAccountingItem,
  loadMonthlyAccountFile,
  saveManagedReconciliation,
  updateAccountingItem,
  uploadBankStatementMetadata,
} from "../service";
import type { AccountingItemType, MonthlyAccountFile } from "../types";

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#0d1316] px-4 py-3 text-white outline-none focus:border-[#c8a467]";
const types: Array<{ value: AccountingItemType; label: string; note: string }> = [
  { value: "payable", label: "Supplier payable", note: "Expense is recorded; payment can happen in a later month." },
  { value: "receivable", label: "Receivable", note: "Income/amount is due to the business but not collected yet." },
  { value: "accrual", label: "Accrued expense", note: "Expense belongs to this month although final invoice/payment is later." },
  { value: "timing", label: "Timing difference", note: "Explained month-end timing item; usually does not block close." },
  { value: "unknown", label: "Unknown bank transaction", note: "Material unknown movements normally block close." },
  { value: "duplicate", label: "Possible duplicate", note: "Potential double posting must be reviewed." },
  { value: "missing_expense", label: "Missing material expense", note: "Known expense is not yet correctly recorded." },
];

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value || 0);
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
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setBusinessId(new URLSearchParams(window.location.search).get("businessId") || "");
  }, []);

  async function refresh(id = businessId, y = year, m = month) {
    if (!id) return;
    const result = await loadMonthlyAccountFile(id, y, m);
    setFile(result.file);
    setDifference(String(result.file.reconciliationDifference || 0));
    setExceptions(String(result.file.bankExceptionCount || 0));
  }

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
      } finally { if (!cancelled) setBusy(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [businessId, year, month]);

  const openItems = useMemo(() => (file?.accountingItems || []).filter((item) => item.status === "open"), [file]);
  const blockingItems = openItems.filter((item) => item.blocksClose);
  const payables = openItems.filter((item) => item.type === "payable");
  const payableTotal = payables.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const locked = Boolean(file?.lockedAt);
  const statementReceived = Boolean(file?.bankStatements?.length);
  const bankBalanced = Math.abs(Number(file?.reconciliationDifference || 0)) <= 0.005;

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
      await refresh();
      setStatement(null);
      setMessage("Bank statement recorded. Use the reconciliation controls and accounting items below to explain the month.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Statement could not be recorded.");
    } finally { setUploading(false); }
  }

  async function saveReconciliation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedDifference = Number(difference);
    const parsedExceptions = Number(exceptions);
    if (!Number.isFinite(parsedDifference) || !Number.isFinite(parsedExceptions) || parsedExceptions < 0) {
      setError("Enter a valid bank difference and exception count.");
      return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await saveManagedReconciliation(businessId, year, month, {
        reconciliationDifference: parsedDifference,
        bankExceptionCount: Math.floor(parsedExceptions),
      });
      setFile(result.file);
      setMessage(Math.abs(parsedDifference) <= 0.005 ? "Bank difference is RM0. Review any remaining accounting exceptions; properly recorded payables/accruals may remain open." : "Reconciliation saved. The bank difference must reach RM0 before close.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reconciliation status could not be saved.");
    } finally { setBusy(false); }
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const type = String(form.get("type")) as AccountingItemType;
    const amount = Number(form.get("amount") || 0);
    setAdding(true); setError(""); setMessage("");
    try {
      const result = await addAccountingItem(businessId, year, month, {
        type,
        counterparty: String(form.get("counterparty") || ""),
        reference: String(form.get("reference") || ""),
        date: String(form.get("date") || ""),
        amount: Number.isFinite(amount) ? amount : 0,
        note: String(form.get("note") || ""),
      });
      setFile(result.file);
      event.currentTarget.reset();
      setMessage(type === "payable" || type === "accrual" || type === "timing" ? "Item recorded. This explained item can remain open at month close unless you deliberately mark it as blocking." : "Accounting exception recorded for review.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Accounting item could not be added.");
    } finally { setAdding(false); }
  }

  async function resolveItem(itemId: string, status: "resolved" | "paid") {
    setBusy(true); setError("");
    try {
      const result = await updateAccountingItem(businessId, year, month, itemId, { status });
      setFile(result.file);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Accounting item could not be updated.");
    } finally { setBusy(false); }
  }

  if (!businessId) {
    return <main className="grid min-h-screen place-items-center bg-[#090d10] px-6 text-center text-[#f4efe6]"><section className="max-w-xl rounded-[28px] border border-white/10 bg-[#11171b] p-8"><h1 className="text-3xl font-semibold text-[#f0dfbd]">Select a managed business first</h1><p className="mt-4 text-sm leading-6 text-white/45">Open the business from Founder Control. Reconciliation always stays inside the selected canonical Business ID.</p><Link href="/founder-john-control/businesses" className="mt-6 inline-flex rounded-full bg-[#c8a467] px-6 py-3 font-bold text-[#111416]">Managed Businesses</Link></section></main>;
  }

  return (
    <main className="min-h-screen bg-[#090d10] px-5 py-8 text-[#f4efe6] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4"><Link href={`/wedge-i?businessId=${encodeURIComponent(businessId)}`} className="text-sm font-medium text-[#c8a467]">← Business Workspace</Link><Link href={`/wedge-i/accounts/pnl?businessId=${encodeURIComponent(businessId)}`} className="rounded-full border border-white/10 px-5 py-2 text-xs font-bold text-white/60">P&amp;L Workspace</Link></div>
        <header className="mt-6 flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-7"><div><p className="text-xs font-semibold tracking-[0.22em] text-[#c8a467]">WEDGE-I · RECONCILIATION</p><h1 className="mt-3 text-3xl font-semibold text-[#f1dfbc]">{monthName(month, year)}</h1><p className="mt-3 text-sm text-white/45">{businessId} · explain every material difference; unpaid suppliers and proper accruals may carry forward.</p></div><div className="flex gap-2"><select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="rounded-xl border border-white/10 bg-[#11171b] px-3 py-2 text-sm">{Array.from({length:12},(_,i)=>i+1).map((value)=><option key={value} value={value}>{new Intl.DateTimeFormat("en-MY",{month:"short"}).format(new Date(2026,value-1,1))}</option>)}</select><input type="number" min="2026" value={year} onChange={(event)=>setYear(Number(event.target.value))} className="w-24 rounded-xl border border-white/10 bg-[#11171b] px-3 py-2 text-sm" /></div></header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Bank difference" value={money(Number(file?.reconciliationDifference || 0))} /><Metric label="Bank exceptions" value={String(file?.bankExceptionCount || 0)} /><Metric label="Blocking items" value={String(blockingItems.length)} /><Metric label="Outstanding payables" value={money(payableTotal)} /><Metric label="Statement" value={statementReceived ? "Received" : "Missing"} /></section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[28px] border border-white/10 bg-[#11171b] p-6"><p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">BANK STATEMENT</p><h2 className="mt-2 text-xl font-semibold text-[#f1dfbc]">Record monthly statement</h2><p className="mt-3 text-xs leading-5 text-white/40">CSV/Excel is preferred for matching; PDF is an acceptable fallback. Never collect internet-banking passwords, PINs or TACs.</p><input disabled={locked} onChange={pickStatement} type="file" accept=".csv,.xlsx,.xls,.pdf,text/csv,application/pdf" className="mt-5 block w-full rounded-xl border border-dashed border-white/15 bg-white/[.03] p-4 text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-[#c8a467] file:px-4 file:py-2 file:font-bold file:text-[#111416]" />{statement ? <p className="mt-3 text-xs text-white/45">Selected: {statement.name}</p> : null}<button type="button" disabled={!statement || uploading || locked} onClick={() => void recordStatement()} className="mt-5 w-full rounded-xl border border-[#c8a467]/30 px-5 py-3 text-sm font-bold text-[#ead3a8] disabled:opacity-40">{uploading ? "Recording…" : "Record Statement"}</button></div>

          <form onSubmit={saveReconciliation} className="rounded-[28px] border border-white/10 bg-[#11171b] p-6"><p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">BANK CONTROL</p><h2 className="mt-2 text-xl font-semibold text-[#f1dfbc]">Reconciliation summary</h2><p className="mt-3 text-xs leading-5 text-white/40">The bank difference must reach RM0. The exception count is operational information; classify material exceptions below so Wedge knows what actually blocks close.</p><label className="mt-5 block text-sm text-white/60">Bank difference (RM)<input disabled={locked} type="number" step="0.01" value={difference} onChange={(event) => setDifference(event.target.value)} className={inputClass} /></label><label className="mt-4 block text-sm text-white/60">Unmatched / review items<input disabled={locked} type="number" min="0" step="1" value={exceptions} onChange={(event) => setExceptions(event.target.value)} className={inputClass} /></label><button disabled={busy || locked} className="mt-5 w-full rounded-xl bg-[#c8a467] px-5 py-3 font-bold text-[#111416] disabled:opacity-40">{busy ? "Saving…" : "Save Reconciliation"}</button></form>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
          <form onSubmit={addItem} className="rounded-[28px] border border-white/10 bg-[#11171b] p-6"><p className="text-xs font-bold tracking-[.2em] text-[#c8a467]">ACCOUNTING ITEM</p><h2 className="mt-2 text-xl font-semibold text-[#f1dfbc]">Explain or carry forward</h2><label className="mt-5 block text-sm text-white/60">Type<select name="type" className={inputClass} defaultValue="payable">{types.map((item)=><option key={item.value} value={item.value}>{item.label}</option>)}</select></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm text-white/60">Counterparty<input name="counterparty" className={inputClass} placeholder="Supplier / customer" /></label><label className="text-sm text-white/60">Amount (RM)<input name="amount" type="number" step="0.01" className={inputClass} placeholder="0.00" /></label><label className="text-sm text-white/60">Date<input name="date" type="date" className={inputClass} /></label><label className="text-sm text-white/60">Reference<input name="reference" className={inputClass} placeholder="Invoice / bank ref" /></label></div><label className="mt-4 block text-sm text-white/60">Note<textarea name="note" className={`${inputClass} min-h-24`} placeholder="Why this item is open / how it should be treated" /></label><button disabled={adding || locked} className="mt-5 w-full rounded-xl border border-[#c8a467]/30 px-5 py-3 text-sm font-bold text-[#ead3a8] disabled:opacity-40">{adding ? "Adding…" : "Add Accounting Item"}</button><div className="mt-5 space-y-2">{types.map((item)=><p key={item.value} className="text-[11px] leading-4 text-white/30"><b className="text-white/45">{item.label}:</b> {item.note}</p>)}</div></form>

          <div className="rounded-[28px] border border-white/10 bg-[#11171b] p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[.2em] text-[#c8a467]">OPEN ITEMS</p><h2 className="mt-2 text-xl font-semibold text-[#f1dfbc]">What remains after reconciliation</h2></div><span className="rounded-full bg-white/[.05] px-3 py-2 text-xs text-white/45">{openItems.length} open</span></div><div className="mt-5 space-y-3">{openItems.map((item)=><article key={item.id} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold capitalize text-[#f0dfbd]">{item.type.replaceAll("_"," ")}{item.blocksClose ? <span className="ml-2 text-[10px] text-red-200">BLOCKS CLOSE</span> : <span className="ml-2 text-[10px] text-emerald-200">CAN CARRY FORWARD</span>}</p><p className="mt-1 text-xs text-white/40">{item.counterparty || "No counterparty"}{item.reference ? ` · ${item.reference}` : ""}</p></div><b>{money(item.amount)}</b></div>{item.note ? <p className="mt-3 text-xs leading-5 text-white/40">{item.note}</p> : null}<div className="mt-4 flex gap-2"><button disabled={busy || locked} onClick={() => void resolveItem(item.id, item.type === "payable" ? "paid" : "resolved")} className="rounded-lg border border-emerald-400/20 px-3 py-2 text-xs font-bold text-emerald-200">{item.type === "payable" ? "Mark Paid" : "Resolve"}</button></div></article>)}{!openItems.length ? <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35">No open accounting items.</p> : null}</div></div>
        </section>

        {error ? <p className="mt-6 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">{error}</p> : null}
        {message ? <p className="mt-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{message}</p> : null}

        <section className="mt-7 rounded-[26px] border border-[#c8a467]/20 bg-[#12181c] p-6"><p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">MONTH CLOSE PRINCIPLE</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Check ok={statementReceived} label="Bank statement received" /><Check ok={bankBalanced} label="Bank difference = RM0" /><Check ok={blockingItems.length === 0} label="No material blocking items" /><Check ok={file?.pnl === "review_required" || file?.pnl === "complete"} label="P&L prepared" /></div><p className="mt-5 text-xs leading-5 text-white/40">Outstanding supplier payables, receivables, accruals and explained timing differences may remain open. They carry forward without duplicating income or expense. Final close is performed from the P&amp;L Workspace after payroll review.</p></section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-[#11171b]/90 p-5"><p className="text-xs uppercase tracking-[0.14em] text-white/35">{label}</p><div className="mt-3 text-xl font-semibold capitalize text-[#f1dfbc]">{value}</div></div>; }
function Check({ ok, label }: { ok: boolean; label: string }) { return <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm text-white/55"><span className={ok ? "text-emerald-300" : "text-amber-200"}>{ok ? "✓" : "!"}</span><span>{label}</span></div>; }
