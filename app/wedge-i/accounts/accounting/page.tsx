"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { founderRequest } from "../../../lib/founderApi";
import { downloadDocx, downloadXlsx, type ExportCell, type ExportSheet, type WordSection } from "./export";

type Account = { code: string; name: string; type: string; subtype?: string; normalBalance: string };
type JournalLine = { accountCode: string; accountName: string; memo?: string; counterparty?: string; debit: number; credit: number };
type Journal = { id: string; entryNo: string; date: string; description: string; sourceType: string; sourceId: string; sourceDocumentId?: string; status: string; totalDebit: number; totalCredit: number; lines: JournalLine[] };
type TrialRow = { code: string; name: string; type: string; debit: number; credit: number; debitBalance: number; creditBalance: number };
type PnlRow = { code: string; name: string; subtype?: string; amount: number };
type BalanceRow = TrialRow & { amount: number };
type BankTransaction = { id: string; date: string; description: string; reference?: string; debit: number; credit: number; amount: number; balance?: number | null; status: string; matchedJournalEntryId?: string; matchMethod?: string };
type ReportPayload = {
  success: true;
  business: { businessId: string; companyCode: string; legalName: string; tradingName?: string; registrationNumber?: string };
  period: string;
  asOf: string;
  reports: {
    period: string;
    generatedAt: string;
    journalCount: number;
    periodDebit: number;
    periodCredit: number;
    balanced: boolean;
    trialBalance: { asOf: string; rows: TrialRow[]; totalDebit: number; totalCredit: number; balanced: boolean };
    pnl: {
      period: string;
      revenue: PnlRow[];
      expenses: PnlRow[];
      totals: {
        revenue: number;
        directCost: number;
        grossProfit: number;
        operatingExpenses: number;
        operatingProfit: number;
        financeCost: number;
        profitBeforeTax: number;
        grossMarginPercent: number;
        operatingMarginPercent: number;
        profitBeforeTaxMarginPercent: number;
      };
    };
    balanceSheet: {
      asOf: string;
      assets: BalanceRow[];
      liabilities: BalanceRow[];
      equity: BalanceRow[];
      currentEarnings: number;
      totals: { assets: number; liabilities: number; equity: number; liabilitiesAndEquity: number; balanced: boolean };
    };
  };
  journals: Journal[];
  accounts: Account[];
  bank: { transactionCount: number; unmatchedCount: number; transactions: BankTransaction[] };
  closeSnapshot?: { closedAt: string; closedBy: string } | null;
};

type LedgerPayload = {
  success: true;
  ledger: {
    account: Account;
    start: string;
    end: string;
    openingBalance: number;
    closingBalance: number;
    rows: Array<{ date: string; entryNo: string; journalEntryId: string; description: string; sourceType: string; sourceId: string; reference?: string; counterparty?: string; debit: number; credit: number; runningBalance: number }>;
  };
};

const tabs = ["Overview", "P&L", "Trial Balance", "Balance Sheet", "Journal Register", "General Ledger", "Bank Reconciliation"] as const;
type Tab = (typeof tabs)[number];

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR", minimumFractionDigits: 2 }).format(Number(value || 0));
}

function number(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fileBase(data: ReportPayload, suffix: string) {
  const name = (data.business.tradingName || data.business.legalName).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return `Wedge-${name || data.business.businessId}-${data.period}-${suffix}`;
}

function pnlRows(data: ReportPayload): ExportCell[][] {
  const pnl = data.reports.pnl;
  return [
    ["Management P&L", data.period, data.business.tradingName || data.business.legalName],
    ["Revenue"],
    ...pnl.revenue.map((row) => [row.code, row.name, row.amount]),
    ["", "Total Revenue", pnl.totals.revenue],
    ["Direct Cost / Cost of Sales"],
    ...pnl.expenses.filter((row) => row.subtype === "cost_of_sales").map((row) => [row.code, row.name, row.amount]),
    ["", "Gross Profit", pnl.totals.grossProfit],
    ["", "Gross Margin %", pnl.totals.grossMarginPercent],
    ["Operating Expenses"],
    ...pnl.expenses.filter((row) => !["cost_of_sales", "finance"].includes(row.subtype || "")).map((row) => [row.code, row.name, row.amount]),
    ["", "Operating Profit", pnl.totals.operatingProfit],
    ["", "Operating Margin %", pnl.totals.operatingMarginPercent],
    ["Finance Cost"],
    ...pnl.expenses.filter((row) => row.subtype === "finance").map((row) => [row.code, row.name, row.amount]),
    ["", "Profit Before Tax", pnl.totals.profitBeforeTax],
    ["", "PBT Margin %", pnl.totals.profitBeforeTaxMarginPercent],
  ];
}

function trialRows(data: ReportPayload): ExportCell[][] {
  return [
    ["Account", "Name", "Type", "Debit Movement", "Credit Movement", "Debit Balance", "Credit Balance"],
    ...data.reports.trialBalance.rows.map((row) => [row.code, row.name, row.type, row.debit, row.credit, row.debitBalance, row.creditBalance]),
    ["", "TOTAL", "", "", "", data.reports.trialBalance.totalDebit, data.reports.trialBalance.totalCredit],
  ];
}

function balanceRows(data: ReportPayload): ExportCell[][] {
  const bs = data.reports.balanceSheet;
  return [
    ["Balance Sheet", data.asOf, data.business.tradingName || data.business.legalName],
    ["Assets"],
    ...bs.assets.map((row) => [row.code, row.name, row.amount]),
    ["", "Total Assets", bs.totals.assets],
    ["Liabilities"],
    ...bs.liabilities.map((row) => [row.code, row.name, row.amount]),
    ["", "Total Liabilities", bs.totals.liabilities],
    ["Equity"],
    ...bs.equity.map((row) => [row.code, row.name, row.amount]),
    ["", "Current Earnings", bs.currentEarnings],
    ["", "Total Equity", bs.totals.equity],
    ["", "Liabilities + Equity", bs.totals.liabilitiesAndEquity],
  ];
}

function journalRows(data: ReportPayload): ExportCell[][] {
  return [
    ["Date", "Entry No", "Status", "Source", "Description", "Account", "Account Name", "Counterparty", "Reference", "Debit", "Credit"],
    ...data.journals.flatMap((entry) => entry.lines.map((line) => [entry.date, entry.entryNo, entry.status, entry.sourceType, entry.description, line.accountCode, line.accountName, line.counterparty || "", line.memo || entry.sourceDocumentId || "", line.debit, line.credit])),
    ["", "PERIOD TOTAL", "", "", "", "", "", "", "", data.reports.periodDebit, data.reports.periodCredit],
  ];
}

function bankRows(data: ReportPayload): ExportCell[][] {
  return [
    ["Date", "Description", "Reference", "Bank Debit", "Bank Credit", "Signed Amount", "Balance", "Status", "Matched Journal"],
    ...data.bank.transactions.map((row) => [row.date, row.description, row.reference || "", row.debit, row.credit, row.amount, row.balance ?? "", row.status, row.matchedJournalEntryId || ""]),
  ];
}

function monthSheets(data: ReportPayload): ExportSheet[] {
  return [
    { name: "P&L", rows: pnlRows(data) },
    { name: "Trial Balance", rows: trialRows(data) },
    { name: "Balance Sheet", rows: balanceRows(data) },
    { name: "Journal Register", rows: journalRows(data) },
    { name: "Bank Reconciliation", rows: bankRows(data) },
  ];
}

function monthWordSections(data: ReportPayload): WordSection[] {
  return [
    { heading: "Business", paragraphs: [`${data.business.tradingName || data.business.legalName} (${data.business.businessId})`, `Period: ${data.period}`, `Accounting status: ${data.reports.balanced ? "Balanced" : "Review required"}`] },
    { heading: "Management P&L", table: pnlRows(data) },
    { heading: "Trial Balance", table: trialRows(data) },
    { heading: "Balance Sheet", table: balanceRows(data) },
    { heading: "Journal Register", table: journalRows(data) },
    { heading: "Bank Reconciliation", paragraphs: [`Transactions: ${data.bank.transactionCount}`, `Unmatched: ${data.bank.unmatchedCount}`], table: bankRows(data) },
  ];
}

function parseCsvLine(line: string) {
  const result: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"' && quoted) { current += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === "," && !quoted) { result.push(current.trim()); current = ""; continue; }
    current += char;
  }
  result.push(current.trim());
  return result;
}

function parseMoneyText(value: string) {
  const cleaned = String(value || "").replace(/[RM,$\s]/gi, "").replace(/[()]/g, (match) => match === "(" ? "-" : "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

function normalizedDate(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (!match) return "";
  return `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

export default function FounderAccountingCentrePage() {
  const [businessId, setBusinessId] = useState("");
  const [period, setPeriod] = useState(currentPeriod());
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [data, setData] = useState<ReportPayload | null>(null);
  const [selectedAccount, setSelectedAccount] = useState("1100");
  const [ledger, setLedger] = useState<LedgerPayload["ledger"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setBusinessId(params.get("businessId") || "");
    if (params.get("period")) setPeriod(params.get("period") || currentPeriod());
    const requestedView = params.get("view");
    if (requestedView === "pnl") setActiveTab("P&L");
    if (requestedView === "bank") setActiveTab("Bank Reconciliation");
  }, []);

  async function loadReports(id = businessId, selectedPeriod = period) {
    if (!id) return;
    setLoading(true); setError("");
    try {
      const result = await founderRequest<ReportPayload>(`/api/founder/control/businesses/${encodeURIComponent(id)}/accounting/reports?period=${encodeURIComponent(selectedPeriod)}`);
      setData(result);
      const active = result.reports.trialBalance.rows.find((row) => row.code === selectedAccount) || result.reports.trialBalance.rows[0];
      if (active && !result.accounts.some((account) => account.code === selectedAccount)) setSelectedAccount(active.code);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Accounting reports could not be loaded.");
    } finally { setLoading(false); }
  }

  useEffect(() => { if (businessId) void loadReports(businessId, period); }, [businessId, period]);

  async function loadLedger(code = selectedAccount) {
    if (!businessId || !code) return;
    setWorking("ledger"); setError("");
    try {
      const result = await founderRequest<LedgerPayload>(`/api/founder/control/businesses/${encodeURIComponent(businessId)}/accounting/ledger/${encodeURIComponent(code)}?period=${encodeURIComponent(period)}`);
      setLedger(result.ledger);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "General ledger could not be loaded.");
    } finally { setWorking(""); }
  }

  useEffect(() => { if (activeTab === "General Ledger" && businessId && selectedAccount) void loadLedger(selectedAccount); }, [activeTab, businessId, selectedAccount, period]);

  async function action(name: string, path: string, body: Record<string, unknown> = {}) {
    if (!businessId) return;
    setWorking(name); setError(""); setMessage("");
    try {
      const response = await founderRequest<{ success: true; message?: string; posted?: number; matched?: number; errors?: unknown[] }>(path, { method: "POST", body: JSON.stringify(body) });
      setMessage(response.message || `${name} completed.`);
      await loadReports();
      if (activeTab === "General Ledger") await loadLedger();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `${name} failed.`);
    } finally { setWorking(""); }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !businessId) return;
    setWorking("bank-import"); setError(""); setMessage("");
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim());
      if (lines.length < 2) throw new Error("CSV statement does not contain transaction rows.");
      const headers = parseCsvLine(lines[0]).map((header) => header.trim().toLowerCase());
      const pick = (names: string[]) => headers.findIndex((header) => names.some((name) => header.includes(name)));
      const dateIndex = pick(["date", "transaction date", "posting date"]);
      const descriptionIndex = pick(["description", "details", "narration", "transaction"]);
      const referenceIndex = pick(["reference", "ref"]);
      const debitIndex = pick(["debit", "withdrawal", "money out"]);
      const creditIndex = pick(["credit", "deposit", "money in"]);
      const amountIndex = pick(["amount"]);
      const balanceIndex = pick(["balance"]);
      if (dateIndex < 0 || descriptionIndex < 0 || (debitIndex < 0 && creditIndex < 0 && amountIndex < 0)) {
        throw new Error("CSV needs Date, Description and Debit/Credit (or Amount) columns. Rename the bank export headers and try again.");
      }
      const rows = lines.slice(1).map((line) => {
        const cols = parseCsvLine(line);
        let debit = debitIndex >= 0 ? parseMoneyText(cols[debitIndex] || "") : 0;
        let credit = creditIndex >= 0 ? parseMoneyText(cols[creditIndex] || "") : 0;
        if (!debit && !credit && amountIndex >= 0) {
          const raw = String(cols[amountIndex] || "").replace(/[RM,$\s]/gi, "");
          const signed = Number(raw.replace(/[()]/g, (match) => match === "(" ? "-" : ""));
          if (Number.isFinite(signed)) { if (signed < 0) debit = Math.abs(signed); else credit = signed; }
        }
        return {
          date: normalizedDate(cols[dateIndex] || ""),
          description: cols[descriptionIndex] || "Bank transaction",
          reference: referenceIndex >= 0 ? cols[referenceIndex] || "" : "",
          debit,
          credit,
          balance: balanceIndex >= 0 && cols[balanceIndex] ? number(String(cols[balanceIndex]).replace(/[RM,$\s]/gi, "")) : null,
        };
      }).filter((row) => row.date && (row.debit > 0 || row.credit > 0));
      if (!rows.length) throw new Error("No valid bank rows were found in the CSV.");
      const result = await founderRequest<{ success: true; inserted: number; duplicates: number; matched: number }>(`/api/founder/control/businesses/${encodeURIComponent(businessId)}/accounting/bank/import`, {
        method: "POST",
        body: JSON.stringify({ statementFileName: file.name, bankAccountCode: "1100", rows }),
      });
      setMessage(`Bank import complete: ${result.inserted} new, ${result.duplicates} duplicate, ${result.matched} auto-matched.`);
      await loadReports();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bank CSV could not be imported.");
    } finally { setWorking(""); }
  }

  async function exportMonthExcel() {
    if (!data) return;
    await downloadXlsx(`${fileBase(data, "Month-End-Accounting-Pack")}.xlsx`, monthSheets(data));
  }
  async function exportMonthWord() {
    if (!data) return;
    await downloadDocx(`${fileBase(data, "Month-End-Accounting-Pack")}.docx`, `WEDGE WORKS MONTH-END ACCOUNTING PACK — ${data.period}`, monthWordSections(data));
  }
  async function exportPnlExcel() {
    if (!data) return;
    await downloadXlsx(`${fileBase(data, "Management-PnL")}.xlsx`, [{ name: "P&L", rows: pnlRows(data) }]);
  }
  async function exportPnlWord() {
    if (!data) return;
    await downloadDocx(`${fileBase(data, "Management-PnL")}.docx`, `WEDGE MANAGEMENT P&L — ${data.period}`, [{ heading: data.business.tradingName || data.business.legalName, table: pnlRows(data) }]);
  }
  async function exportLedgerExcel() {
    if (!data || !ledger) return;
    const rows: ExportCell[][] = [["Date", "Entry No", "Description", "Source", "Reference", "Counterparty", "Debit", "Credit", "Running Balance"], ...ledger.rows.map((row) => [row.date, row.entryNo, row.description, row.sourceType, row.reference || "", row.counterparty || "", row.debit, row.credit, row.runningBalance])];
    await downloadXlsx(`${fileBase(data, `GL-${ledger.account.code}`)}.xlsx`, [{ name: `GL ${ledger.account.code}`, rows }]);
  }
  async function exportLedgerWord() {
    if (!data || !ledger) return;
    const rows: ExportCell[][] = [["Date", "Entry No", "Description", "Reference", "Debit", "Credit", "Balance"], ...ledger.rows.map((row) => [row.date, row.entryNo, row.description, row.reference || "", row.debit, row.credit, row.runningBalance])];
    await downloadDocx(`${fileBase(data, `GL-${ledger.account.code}`)}.docx`, `GENERAL LEDGER — ${ledger.account.code} ${ledger.account.name}`, [{ paragraphs: [`Business: ${data.business.tradingName || data.business.legalName}`, `Period: ${data.period}`, `Opening: ${money(ledger.openingBalance)} · Closing: ${money(ledger.closingBalance)}`], table: rows }]);
  }

  if (!businessId) return <main className="grid min-h-screen place-items-center bg-[#090d10] text-white"><Link href="/founder-john-control/businesses" className="text-[#d2aa62]">Select a managed business first →</Link></main>;
  if (loading && !data) return <main className="grid min-h-screen place-items-center bg-[#090d10] text-white/60">Loading accounting ledger…</main>;

  const name = data?.business.tradingName || data?.business.legalName || businessId;
  const balanced = Boolean(data?.reports.balanced && data?.reports.trialBalance.balanced && data?.reports.balanceSheet.totals.balanced);

  return (
    <main className="min-h-screen bg-[#090d10] px-5 py-8 text-[#f4efe6] sm:px-8">
      <div className="mx-auto max-w-[1550px]">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 xl:flex-row xl:items-end xl:justify-between">
          <div><Link href={`/wedge-i?businessId=${encodeURIComponent(businessId)}`} className="text-sm font-semibold text-[#d2aa62]">← Business Workspace</Link><p className="mt-5 text-xs font-bold tracking-[.22em] text-[#d2aa62]">WEDGE-I · DOUBLE-ENTRY ACCOUNTING CENTRE</p><h1 className="mt-2 text-4xl font-semibold text-[#f0dfbd]">{name}</h1><p className="mt-2 text-sm text-white/40">{data?.business.companyCode} · {businessId} · Period {period}</p></div>
          <div className="flex flex-wrap gap-2"><label className="text-xs text-white/45">Month <input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="ml-2 rounded-xl border border-white/10 bg-[#11171b] px-3 py-2 text-white" /></label><button onClick={() => void exportMonthExcel()} disabled={!data} className="rounded-xl border border-emerald-300/25 px-4 py-2 text-xs font-bold text-emerald-200">Excel Month Pack</button><button onClick={() => void exportMonthWord()} disabled={!data} className="rounded-xl border border-blue-300/25 px-4 py-2 text-xs font-bold text-blue-200">Word Month Pack</button></div>
        </header>

        {error ? <div className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">{error}</div> : null}
        {message ? <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{message}</div> : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Metric label="Journal Entries" value={String(data?.reports.journalCount || 0)} />
          <Metric label="Period Debits" value={money(data?.reports.periodDebit || 0)} />
          <Metric label="Period Credits" value={money(data?.reports.periodCredit || 0)} />
          <Metric label="Bank Unmatched" value={String(data?.bank.unmatchedCount || 0)} warn={Boolean(data?.bank.unmatchedCount)} />
          <Metric label="PBT" value={money(data?.reports.pnl.totals.profitBeforeTax || 0)} warn={(data?.reports.pnl.totals.profitBeforeTax || 0) < 0} />
          <Metric label="Ledger Status" value={balanced ? "BALANCED" : "REVIEW"} warn={!balanced} />
        </section>

        <section className="mt-6 flex flex-wrap gap-2 border-b border-white/10 pb-4">{tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-xs font-bold ${activeTab === tab ? "bg-[#d2aa62] text-black" : "border border-white/10 text-white/55"}`}>{tab}</button>)}</section>

        {activeTab === "Overview" && data ? <Overview data={data} working={working} onAction={action} onImportCsv={importCsv} /> : null}
        {activeTab === "P&L" && data ? <PnlView data={data} onExcel={exportPnlExcel} onWord={exportPnlWord} /> : null}
        {activeTab === "Trial Balance" && data ? <TrialView data={data} /> : null}
        {activeTab === "Balance Sheet" && data ? <BalanceView data={data} /> : null}
        {activeTab === "Journal Register" && data ? <JournalView data={data} /> : null}
        {activeTab === "General Ledger" && data ? <LedgerView data={data} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} ledger={ledger} working={working} onExcel={exportLedgerExcel} onWord={exportLedgerWord} /> : null}
        {activeTab === "Bank Reconciliation" && data ? <BankView data={data} working={working} onImportCsv={importCsv} onAutoMatch={() => action("Bank auto-match", `/api/founder/control/businesses/${encodeURIComponent(businessId)}/accounting/bank/auto-match`, { bankAccountCode: "1100" })} /> : null}
      </div>
    </main>
  );
}

function Overview({ data, working, onAction, onImportCsv }: { data: ReportPayload; working: string; onAction: (name: string, path: string, body?: Record<string, unknown>) => Promise<void>; onImportCsv: (event: ChangeEvent<HTMLInputElement>) => Promise<void> }) {
  const id = encodeURIComponent(data.business.businessId);
  return <section className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
    <div className="rounded-[28px] border border-white/10 bg-[#11171b] p-6"><p className="text-xs font-bold tracking-[.18em] text-[#d2aa62]">MONTH-END POSTING FLOW</p><h2 className="mt-2 text-2xl font-semibold text-[#f0dfbd]">Books → Payroll → Bank → Ledger → Reports</h2><div className="mt-6 grid gap-3 sm:grid-cols-2">
      <ActionButton disabled={Boolean(working)} onClick={() => onAction("Books sync", `/api/founder/control/businesses/${id}/accounting/sync-books`, { period: data.period })} title="1. Post Ready WedgeBooks" body="Posts approved purchase/sales documents into balanced journals." />
      <ActionButton disabled={Boolean(working)} onClick={() => onAction("Payroll sync", `/api/founder/control/businesses/${id}/accounting/sync-payroll`, { period: data.period })} title="2. Post Issued Payroll" body="Posts salary, OT, employer statutory cost and payroll liabilities." />
      <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/[.025] p-5 hover:border-[#d2aa62]/35"><p className="text-sm font-bold text-[#ead3a8]">3. Import Bank CSV</p><p className="mt-2 text-xs leading-5 text-white/40">Upload normalized bank CSV. Wedge removes duplicates and auto-matches ledger entries.</p><input type="file" accept=".csv,text/csv" onChange={(event) => void onImportCsv(event)} className="mt-4 block w-full text-xs text-white/45" /></label>
      <ActionButton disabled={Boolean(working)} onClick={() => onAction("Accounting month close", `/api/founder/control/businesses/${id}/accounting/month-close`, { period: data.period, reason: "Founder reviewed balanced ledger and month-end reports." })} title="4. Lock Accounting Month" body="Creates the immutable Trial Balance, P&L and Balance Sheet snapshot." />
    </div></div>
    <aside className="rounded-[28px] border border-[#d2aa62]/20 bg-[#12181c] p-6"><p className="text-xs font-bold tracking-[.18em] text-[#d2aa62]">CONTROL CHECK</p><div className="mt-5 space-y-3"><Check ok={data.reports.periodDebit === data.reports.periodCredit} text={`Period journal balances: ${money(data.reports.periodDebit)} = ${money(data.reports.periodCredit)}`} /><Check ok={data.reports.trialBalance.balanced} text="Trial Balance debit = credit" /><Check ok={data.reports.balanceSheet.totals.balanced} text="Balance Sheet assets = liabilities + equity" /><Check ok={data.bank.unmatchedCount === 0} text={`${data.bank.unmatchedCount} unmatched bank transaction(s)`} /><Check ok={Boolean(data.closeSnapshot)} text={data.closeSnapshot ? `Month locked by ${data.closeSnapshot.closedBy}` : "Month not yet locked"} /></div></aside>
  </section>;
}

function PnlView({ data, onExcel, onWord }: { data: ReportPayload; onExcel: () => Promise<void>; onWord: () => Promise<void> }) {
  const pnl = data.reports.pnl;
  return <section className="mt-7 space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[.18em] text-[#d2aa62]">LEDGER-DERIVED MANAGEMENT P&L</p><h2 className="mt-2 text-3xl font-semibold text-[#f0dfbd]">{data.period}</h2></div><div className="flex gap-2"><button onClick={() => void onExcel()} className="rounded-xl border border-emerald-300/25 px-4 py-2 text-xs font-bold text-emerald-200">Export Excel</button><button onClick={() => void onWord()} className="rounded-xl border border-blue-300/25 px-4 py-2 text-xs font-bold text-blue-200">Export Word</button></div></div><div className="grid gap-3 sm:grid-cols-4"><Metric label="Revenue" value={money(pnl.totals.revenue)} /><Metric label="Gross Profit" value={money(pnl.totals.grossProfit)} /><Metric label="Operating Profit" value={money(pnl.totals.operatingProfit)} /><Metric label="Profit Before Tax" value={money(pnl.totals.profitBeforeTax)} warn={pnl.totals.profitBeforeTax < 0} /></div><ReportTable rows={pnlRows(data)} /></section>;
}

function TrialView({ data }: { data: ReportPayload }) { return <section className="mt-7"><Heading title="Trial Balance" detail={`As at ${data.asOf} · ${data.reports.trialBalance.balanced ? "Balanced" : "Review required"}`} /><ReportTable rows={trialRows(data)} /></section>; }
function BalanceView({ data }: { data: ReportPayload }) { return <section className="mt-7"><Heading title="Balance Sheet" detail={`As at ${data.asOf} · ${data.reports.balanceSheet.totals.balanced ? "Balanced" : "Review required"}`} /><ReportTable rows={balanceRows(data)} /></section>; }
function JournalView({ data }: { data: ReportPayload }) { return <section className="mt-7"><Heading title="Journal Register" detail={`${data.journals.length} journal entries · posted entries are corrected by reversal, not overwrite`} /><ReportTable rows={journalRows(data)} /></section>; }

function LedgerView({ data, selectedAccount, setSelectedAccount, ledger, working, onExcel, onWord }: { data: ReportPayload; selectedAccount: string; setSelectedAccount: (value: string) => void; ledger: LedgerPayload["ledger"] | null; working: string; onExcel: () => Promise<void>; onWord: () => Promise<void> }) {
  const rows: ExportCell[][] = ledger ? [["Date", "Entry No", "Description", "Reference", "Counterparty", "Debit", "Credit", "Running Balance"], ...ledger.rows.map((row) => [row.date, row.entryNo, row.description, row.reference || "", row.counterparty || "", row.debit, row.credit, row.runningBalance])] : [];
  return <section className="mt-7"><div className="flex flex-wrap items-end justify-between gap-4"><label className="text-xs font-semibold text-white/50">Ledger account<select value={selectedAccount} onChange={(event) => setSelectedAccount(event.target.value)} className="mt-2 block min-w-72 rounded-xl border border-white/10 bg-[#11171b] px-4 py-3 text-white">{data.accounts.map((account) => <option key={account.code} value={account.code}>{account.code} · {account.name}</option>)}</select></label><div className="flex gap-2"><button onClick={() => void onExcel()} disabled={!ledger} className="rounded-xl border border-emerald-300/25 px-4 py-2 text-xs font-bold text-emerald-200 disabled:opacity-40">Ledger Excel</button><button onClick={() => void onWord()} disabled={!ledger} className="rounded-xl border border-blue-300/25 px-4 py-2 text-xs font-bold text-blue-200 disabled:opacity-40">Ledger Word</button></div></div>{working === "ledger" ? <p className="mt-6 text-sm text-white/40">Loading ledger…</p> : ledger ? <><div className="mt-5 grid gap-3 sm:grid-cols-3"><Metric label="Account" value={`${ledger.account.code} ${ledger.account.name}`} /><Metric label="Opening" value={money(ledger.openingBalance)} /><Metric label="Closing" value={money(ledger.closingBalance)} /></div><ReportTable rows={rows} /></> : null}</section>;
}

function BankView({ data, working, onImportCsv, onAutoMatch }: { data: ReportPayload; working: string; onImportCsv: (event: ChangeEvent<HTMLInputElement>) => Promise<void>; onAutoMatch: () => Promise<void> }) { return <section className="mt-7"><div className="flex flex-wrap items-end justify-between gap-4"><Heading title="Bank Reconciliation" detail={`${data.bank.transactionCount} imported · ${data.bank.unmatchedCount} unmatched`} /><div className="flex flex-wrap gap-2"><label className="cursor-pointer rounded-xl border border-white/15 px-4 py-2 text-xs font-bold text-white/60">Import CSV<input type="file" accept=".csv,text/csv" onChange={(event) => void onImportCsv(event)} className="hidden" /></label><button disabled={Boolean(working)} onClick={() => void onAutoMatch()} className="rounded-xl bg-[#d2aa62] px-4 py-2 text-xs font-bold text-black">Auto-match Ledger</button></div></div><ReportTable rows={bankRows(data)} /></section>; }

function ReportTable({ rows }: { rows: ExportCell[][] }) { if (!rows.length) return <p className="mt-5 text-sm text-white/35">No records.</p>; return <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10"><table className="min-w-full text-left text-xs"><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className={rowIndex === 0 ? "bg-white/[.06] font-bold text-[#ead3a8]" : "border-t border-white/[.05] text-white/60"}>{row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-4 py-3">{typeof cell === "number" ? (cellIndex >= row.length - 4 ? money(cell) : cell) : String(cell ?? "")}</td>)}</tr>)}</tbody></table></div>; }
function Heading({ title, detail }: { title: string; detail: string }) { return <div><p className="text-xs font-bold tracking-[.18em] text-[#d2aa62]">ACCOUNTING REPORT</p><h2 className="mt-2 text-3xl font-semibold text-[#f0dfbd]">{title}</h2><p className="mt-2 text-sm text-white/40">{detail}</p></div>; }
function Metric({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) { return <div className="rounded-2xl border border-white/10 bg-[#11171b] p-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-white/30">{label}</p><p className={`mt-2 text-base font-bold ${warn ? "text-amber-200" : "text-[#f0dfbd]"}`}>{value}</p></div>; }
function Check({ ok, text }: { ok: boolean; text: string }) { return <div className="flex gap-3 rounded-xl border border-white/[.06] bg-white/[.025] p-3 text-sm text-white/55"><span className={ok ? "text-emerald-300" : "text-amber-200"}>{ok ? "✓" : "!"}</span><span>{text}</span></div>; }
function ActionButton({ title, body, disabled, onClick }: { title: string; body: string; disabled: boolean; onClick: () => void }) { return <button disabled={disabled} onClick={onClick} className="rounded-2xl border border-white/10 bg-white/[.025] p-5 text-left hover:border-[#d2aa62]/35 disabled:opacity-45"><p className="text-sm font-bold text-[#ead3a8]">{title}</p><p className="mt-2 text-xs leading-5 text-white/40">{body}</p></button>; }
