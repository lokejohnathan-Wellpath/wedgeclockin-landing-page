"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { founderRequest } from "../../../lib/founderApi";
import { downloadDocx, downloadXlsx, type ExportCell, type ExportSheet, type WordSection } from "./export";

type Account = { code: string; name: string; type: string; subtype?: string };
type JournalLine = { accountCode: string; accountName: string; memo?: string; counterparty?: string; debit: number; credit: number };
type Journal = { id: string; entryNo: string; date: string; status: string; sourceType: string; description: string; totalDebit: number; totalCredit: number; lines: JournalLine[] };
type BankRow = { id: string; date: string; description: string; reference?: string; debit: number; credit: number; amount: number; status: string; matchedJournalEntryId?: string };
type Reports = {
  success: true;
  business: { businessId: string; legalName: string; tradingName?: string; companyCode: string };
  period: string;
  asOf: string;
  accounts: Account[];
  journals: Journal[];
  bank: { transactionCount: number; unmatchedCount: number; transactions: BankRow[] };
  reports: {
    periodDebit: number;
    periodCredit: number;
    trialBalance: { rows: Array<{ code: string; name: string; type: string; debit: number; credit: number; debitBalance: number; creditBalance: number }>; totalDebit: number; totalCredit: number; balanced: boolean };
    pnl: { revenue: Array<{ code: string; name: string; subtype?: string; amount: number }>; expenses: Array<{ code: string; name: string; subtype?: string; amount: number }>; totals: Record<string, number> };
    balanceSheet: { assets: Array<{ code: string; name: string; amount: number }>; liabilities: Array<{ code: string; name: string; amount: number }>; equity: Array<{ code: string; name: string; amount: number }>; currentEarnings: number; totals: { assets: number; liabilities: number; equity: number; liabilitiesAndEquity: number; balanced: boolean } };
  };
};

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
function monthEnd(period: string) {
  const [year, month] = period.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
}
function num(value: FormDataEntryValue | null) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(Number(value || 0));
}
function baseName(data: Reports, suffix: string) {
  const name = (data.business.tradingName || data.business.legalName).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return `Wedge-${name || data.business.businessId}-${data.period}-${suffix}`;
}
function pnlRows(data: Reports): ExportCell[][] {
  const p = data.reports.pnl;
  return [
    ["Code", "Management P&L", "Amount (RM)"],
    ["", "REVENUE", ""],
    ...p.revenue.map((row) => [row.code, row.name, row.amount]),
    ["", "Total Revenue", p.totals.revenue || 0],
    ["", "DIRECT COST / COST OF SALES", ""],
    ...p.expenses.filter((row) => row.subtype === "cost_of_sales").map((row) => [row.code, row.name, row.amount]),
    ["", "Gross Profit", p.totals.grossProfit || 0],
    ["", "Gross Margin %", p.totals.grossMarginPercent || 0],
    ["", "OPERATING EXPENSES", ""],
    ...p.expenses.filter((row) => !["cost_of_sales", "finance"].includes(row.subtype || "")).map((row) => [row.code, row.name, row.amount]),
    ["", "Operating Profit", p.totals.operatingProfit || 0],
    ["", "Finance Cost", p.totals.financeCost || 0],
    ["", "Profit Before Tax", p.totals.profitBeforeTax || 0],
    ["", "PBT Margin %", p.totals.profitBeforeTaxMarginPercent || 0],
  ];
}
function trialRows(data: Reports): ExportCell[][] {
  return [["Account", "Name", "Type", "Debit Movement", "Credit Movement", "Debit Balance", "Credit Balance"], ...data.reports.trialBalance.rows.map((row) => [row.code, row.name, row.type, row.debit, row.credit, row.debitBalance, row.creditBalance]), ["", "TOTAL", "", "", "", data.reports.trialBalance.totalDebit, data.reports.trialBalance.totalCredit]];
}
function balanceRows(data: Reports): ExportCell[][] {
  const b = data.reports.balanceSheet;
  return [["Code", `Balance Sheet as at ${data.asOf}`, "Amount (RM)"], ["", "ASSETS", ""], ...b.assets.map((row) => [row.code, row.name, row.amount]), ["", "Total Assets", b.totals.assets], ["", "LIABILITIES", ""], ...b.liabilities.map((row) => [row.code, row.name, row.amount]), ["", "Total Liabilities", b.totals.liabilities], ["", "EQUITY", ""], ...b.equity.map((row) => [row.code, row.name, row.amount]), ["", "Current / accumulated earnings", b.currentEarnings], ["", "Total Equity", b.totals.equity], ["", "Liabilities + Equity", b.totals.liabilitiesAndEquity]];
}
function journalRows(data: Reports): ExportCell[][] {
  return [["Date", "Entry No", "Status", "Source", "Description", "Account", "Account Name", "Counterparty", "Reference", "Debit", "Credit"], ...data.journals.flatMap((entry) => entry.lines.map((line) => [entry.date, entry.entryNo, entry.status, entry.sourceType, entry.description, line.accountCode, line.accountName, line.counterparty || "", line.memo || "", line.debit, line.credit])), ["", "PERIOD TOTAL", "", "", "", "", "", "", "", data.reports.periodDebit, data.reports.periodCredit]];
}
function bankRows(data: Reports): ExportCell[][] {
  return [["Date", "Description", "Reference", "Bank Debit", "Bank Credit", "Signed Amount", "Status", "Matched Journal"], ...data.bank.transactions.map((row) => [row.date, row.description, row.reference || "", row.debit, row.credit, row.amount, row.status, row.matchedJournalEntryId || ""])];
}
function sheets(data: Reports): ExportSheet[] {
  return [{ name: "P&L", rows: pnlRows(data) }, { name: "Trial Balance", rows: trialRows(data) }, { name: "Balance Sheet", rows: balanceRows(data) }, { name: "Journal Register", rows: journalRows(data) }, { name: "Bank Reconciliation", rows: bankRows(data) }];
}
function word(data: Reports, title: string, rows: ExportCell[][]): WordSection[] {
  return [{ heading: data.business.tradingName || data.business.legalName, paragraphs: [`Period: ${data.period}`, `Business ID: ${data.business.businessId}`], table: rows }];
}

export default function AccountingTools() {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<"sales" | "journal" | "bank" | "exports">("sales");
  const [businessId, setBusinessId] = useState("");
  const [period, setPeriod] = useState(currentPeriod());
  const [data, setData] = useState<Reports | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setBusinessId(params.get("businessId") || "");
    setPeriod(params.get("period") || currentPeriod());
  }, []);

  async function refresh() {
    if (!businessId) return;
    const result = await founderRequest<Reports>(`/api/founder/control/businesses/${encodeURIComponent(businessId)}/accounting/reports?period=${encodeURIComponent(period)}`);
    setData(result);
  }
  useEffect(() => { if (open && businessId) void refresh().catch(() => undefined); }, [open, businessId, period]);

  const expenseAccounts = useMemo(() => data?.accounts.filter((account) => ["expense", "asset", "liability", "equity", "revenue"].includes(account.type)) || [], [data]);
  const unmatched = useMemo(() => data?.bank.transactions.filter((row) => row.status === "unmatched") || [], [data]);

  async function postSales(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!businessId) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(""); setMessage("");
    try {
      const payload = { period, foodSales: num(form.get("foodSales")), beverageSales: num(form.get("beverageSales")), otherSales: num(form.get("otherSales")), serviceCharge: num(form.get("serviceCharge")), sst: num(form.get("sst")), cash: num(form.get("cash")), card: num(form.get("card")), qr: num(form.get("qr")), grabFood: num(form.get("grabFood")), foodPanda: num(form.get("foodPanda")), otherTender: num(form.get("otherTender")) };
      const result = await founderRequest<{ success: true; message: string }>(`/api/founder/control/businesses/${encodeURIComponent(businessId)}/accounting/sales-summary`, { method: "POST", body: JSON.stringify(payload) });
      setMessage(result.message); await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Sales could not be posted."); }
    finally { setBusy(false); }
  }

  async function postJournal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!businessId) return;
    const form = new FormData(event.currentTarget);
    const amount = num(form.get("amount"));
    if (amount <= 0) { setError("Journal amount must be above RM0."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await founderRequest<{ success: true; journal: { entryNo: string } }>(`/api/founder/control/businesses/${encodeURIComponent(businessId)}/accounting/journals`, { method: "POST", body: JSON.stringify({ date: String(form.get("date") || monthEnd(period)), description: String(form.get("description") || "Manual accounting adjustment"), lines: [{ accountCode: String(form.get("debitAccount") || ""), debit: amount, credit: 0, memo: String(form.get("reference") || "") }, { accountCode: String(form.get("creditAccount") || ""), debit: 0, credit: amount, memo: String(form.get("reference") || "") }] }) });
      setMessage(`Journal ${result.journal.entryNo} posted and balanced.`); await refresh(); event.currentTarget.reset();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Journal could not be posted."); }
    finally { setBusy(false); }
  }

  async function postBank(row: BankRow) {
    if (!businessId) return;
    const suggested = row.amount < 0 ? "2000" : "1200";
    const accountCode = window.prompt(`Offset account for ${row.description}\n${money(Math.abs(row.amount))}\nExamples: 2000 Trade Payables, 6110 Utilities, 1200 Receivables, 4000 Sales.`, suggested);
    if (!accountCode?.trim()) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await founderRequest(`/api/founder/control/businesses/${encodeURIComponent(businessId)}/accounting/bank/transactions/${encodeURIComponent(row.id)}/post`, { method: "POST", body: JSON.stringify({ offsetAccountCode: accountCode.trim().toUpperCase(), description: row.description }) });
      setMessage("Bank transaction posted to the ledger and reconciled."); await refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Bank transaction could not be posted."); }
    finally { setBusy(false); }
  }

  async function exportReport(kind: "pnl" | "trial" | "balance" | "journal" | "bank" | "pack", format: "xlsx" | "docx") {
    if (!data) await refresh();
    const source = data || await founderRequest<Reports>(`/api/founder/control/businesses/${encodeURIComponent(businessId)}/accounting/reports?period=${encodeURIComponent(period)}`);
    const map = { pnl: { label: "Management-PnL", title: "MANAGEMENT P&L", rows: pnlRows(source) }, trial: { label: "Trial-Balance", title: "TRIAL BALANCE", rows: trialRows(source) }, balance: { label: "Balance-Sheet", title: "BALANCE SHEET", rows: balanceRows(source) }, journal: { label: "Journal-Register", title: "JOURNAL REGISTER", rows: journalRows(source) }, bank: { label: "Bank-Reconciliation", title: "BANK RECONCILIATION", rows: bankRows(source) } } as const;
    if (kind === "pack") {
      if (format === "xlsx") await downloadXlsx(`${baseName(source, "Month-End-Accounting-Pack")}.xlsx`, sheets(source));
      else await downloadDocx(`${baseName(source, "Month-End-Accounting-Pack")}.docx`, `WEDGE MONTH-END ACCOUNTING PACK — ${source.period}`, [{ heading: "Management P&L", table: pnlRows(source) }, { heading: "Trial Balance", table: trialRows(source) }, { heading: "Balance Sheet", table: balanceRows(source) }, { heading: "Journal Register", table: journalRows(source) }, { heading: "Bank Reconciliation", table: bankRows(source) }]);
      return;
    }
    const selected = map[kind];
    if (format === "xlsx") await downloadXlsx(`${baseName(source, selected.label)}.xlsx`, [{ name: selected.title, rows: selected.rows }]);
    else await downloadDocx(`${baseName(source, selected.label)}.docx`, `${selected.title} — ${source.period}`, word(source, selected.title, selected.rows));
  }

  if (!businessId) return null;
  return <>
    <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 rounded-full bg-[#d2aa62] px-5 py-3 text-sm font-bold text-black shadow-xl">Accounting Tools</button>
    {open ? <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"><div className="mx-auto my-5 max-w-5xl rounded-[28px] border border-white/10 bg-[#0e1417] p-5 text-[#f4efe6] shadow-2xl sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold tracking-[.18em] text-[#d2aa62]">FOUNDER POSTING & EXPORT TOOLS</p><h2 className="mt-2 text-2xl font-semibold text-[#f0dfbd]">{period}</h2></div><button onClick={() => setOpen(false)} className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60">Close</button></div>
      <div className="mt-5 flex flex-wrap gap-2">{(["sales","journal","bank","exports"] as const).map((item) => <button key={item} onClick={() => setSection(item)} className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${section === item ? "bg-[#d2aa62] text-black" : "border border-white/10 text-white/55"}`}>{item}</button>)}</div>
      {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p> : null}{message ? <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">{message}</p> : null}
      {section === "sales" ? <SalesForm onSubmit={postSales} busy={busy} /> : null}
      {section === "journal" ? <JournalForm onSubmit={postJournal} accounts={expenseAccounts} busy={busy} period={period} /> : null}
      {section === "bank" ? <div className="mt-6"><p className="text-sm text-white/50">Unmatched bank transactions: {unmatched.length}. Post only when you understand the counter-account; supplier settlements normally go to Trade Payables, not a new expense.</p><div className="mt-4 space-y-2">{unmatched.slice(0,100).map((row) => <div key={row.id} className="flex flex-col gap-3 rounded-xl border border-white/[.07] bg-white/[.025] p-4 sm:flex-row sm:items-center sm:justify-between"><div><b className="text-sm text-white/75">{row.date} · {row.description}</b><p className="mt-1 text-xs text-white/35">{row.reference || "No reference"}</p></div><div className="flex items-center gap-3"><span className={row.amount < 0 ? "text-red-200" : "text-emerald-200"}>{money(row.amount)}</span><button disabled={busy} onClick={() => void postBank(row)} className="rounded-lg border border-[#d2aa62]/30 px-3 py-2 text-xs font-bold text-[#ead3a8]">Post / Reconcile</button></div></div>)}{!unmatched.length ? <p className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-sm text-emerald-200">No unmatched bank transactions.</p> : null}</div></div> : null}
      {section === "exports" ? <ExportGrid onExport={exportReport} /> : null}
    </div></div> : null}
  </>;
}

function SalesForm({ onSubmit, busy }: { onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>; busy: boolean }) {
  const fields = [["foodSales","Food Sales"],["beverageSales","Beverage Sales"],["otherSales","Other Sales / General Revenue"],["serviceCharge","Service Charge"],["sst","SST"],["cash","Cash"],["card","Card"],["qr","QR / DuitNow"],["grabFood","GrabFood"],["foodPanda","foodpanda"],["otherTender","Other Tender"]];
  return <form onSubmit={(event) => void onSubmit(event)} className="mt-6"><p className="text-sm leading-6 text-white/45">Enter the approved monthly POS/sales summary. For a non-F&amp;B client, put revenue under <b className="text-white/65">Other Sales / General Revenue</b>. If tenders are lower than gross sales, Wedge posts the unsettled difference to Trade Receivables.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([name,label]) => <label key={name} className="text-xs font-semibold text-white/50">{label}<input name={name} type="number" min="0" step="0.01" defaultValue="0" className="mt-2 w-full rounded-xl border border-white/10 bg-[#11191d] px-3 py-2.5 text-white" /></label>)}</div><button disabled={busy} className="mt-5 rounded-xl bg-[#d2aa62] px-5 py-3 text-sm font-bold text-black disabled:opacity-40">Post Approved Sales to Ledger</button></form>;
}
function JournalForm({ onSubmit, accounts, busy, period }: { onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>; accounts: Account[]; busy: boolean; period: string }) {
  return <form onSubmit={(event) => void onSubmit(event)} className="mt-6"><p className="text-sm leading-6 text-white/45">Use for reviewed accruals, corrections, opening balances or other accountant-approved entries. Posted journals are not overwritten; corrections use reversal entries.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-xs text-white/50">Date<input name="date" type="date" defaultValue={monthEnd(period)} required className="mt-2 w-full rounded-xl border border-white/10 bg-[#11191d] px-3 py-2.5 text-white" /></label><label className="text-xs text-white/50">Amount<input name="amount" type="number" min="0.01" step="0.01" required className="mt-2 w-full rounded-xl border border-white/10 bg-[#11191d] px-3 py-2.5 text-white" /></label><label className="text-xs text-white/50">Debit account<select name="debitAccount" required className="mt-2 w-full rounded-xl border border-white/10 bg-[#11191d] px-3 py-2.5 text-white">{accounts.map((account) => <option key={`d-${account.code}`} value={account.code}>{account.code} · {account.name}</option>)}</select></label><label className="text-xs text-white/50">Credit account<select name="creditAccount" required className="mt-2 w-full rounded-xl border border-white/10 bg-[#11191d] px-3 py-2.5 text-white">{accounts.map((account) => <option key={`c-${account.code}`} value={account.code}>{account.code} · {account.name}</option>)}</select></label><label className="text-xs text-white/50 sm:col-span-2">Description<input name="description" required placeholder="e.g. Accrue August electricity expense" className="mt-2 w-full rounded-xl border border-white/10 bg-[#11191d] px-3 py-2.5 text-white" /></label><label className="text-xs text-white/50 sm:col-span-2">Reference<input name="reference" placeholder="Invoice / supporting reference" className="mt-2 w-full rounded-xl border border-white/10 bg-[#11191d] px-3 py-2.5 text-white" /></label></div><button disabled={busy} className="mt-5 rounded-xl bg-[#d2aa62] px-5 py-3 text-sm font-bold text-black disabled:opacity-40">Post Balanced Journal</button></form>;
}
function ExportGrid({ onExport }: { onExport: (kind: "pnl"|"trial"|"balance"|"journal"|"bank"|"pack", format: "xlsx"|"docx") => Promise<void> }) {
  const reports: Array<["pnl"|"trial"|"balance"|"journal"|"bank"|"pack",string]> = [["pack","Complete Month-End Pack"],["pnl","Management P&L"],["trial","Trial Balance"],["balance","Balance Sheet"],["journal","Journal Register"],["bank","Bank Reconciliation"]];
  return <div className="mt-6 grid gap-3 sm:grid-cols-2">{reports.map(([key,label]) => <div key={key} className="rounded-xl border border-white/[.07] bg-white/[.025] p-4"><b className="text-sm text-[#ead3a8]">{label}</b><div className="mt-3 flex gap-2"><button onClick={() => void onExport(key,"xlsx")} className="rounded-lg border border-emerald-300/20 px-3 py-2 text-xs font-bold text-emerald-200">Excel .xlsx</button><button onClick={() => void onExport(key,"docx")} className="rounded-lg border border-blue-300/20 px-3 py-2 text-xs font-bold text-blue-200">Word .docx</button></div></div>)}</div>;
}
