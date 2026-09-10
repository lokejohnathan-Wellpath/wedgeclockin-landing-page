"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { loadBooksCloudState } from "../../books/books-cloud";
import { buildIntegratedPnlInput, type IntegratedPnlInput, type PayrollRecordForPnl } from "../integration";
import { calculateIndustryPnl, type CalculatedIndustryPnl, type PnlValueMap } from "../pnlEngine";
import { getIndustryPnlTemplate } from "../pnlTemplates";
import { MANAGED_ACCOUNT_INDUSTRIES, type ManagedAccountIndustry } from "../types";

const inputClass = "w-full rounded-xl border border-white/10 bg-[#0d1316] px-3 py-2.5 text-sm text-white outline-none focus:border-[#c8a467]";

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value);
}

function monthName(month: number, year: number) {
  return new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
}

export default function IntegratedPnlWorkspacePage() {
  const now = new Date();
  const [industry, setIndustry] = useState<ManagedAccountIndustry>("F&B - Restaurant / Cafe / QSR");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [revenue, setRevenue] = useState<Record<string, string>>({});
  const [serviceCharge, setServiceCharge] = useState("");
  const [sst, setSst] = useState("");
  const [result, setResult] = useState<CalculatedIndustryPnl | null>(null);
  const [integration, setIntegration] = useState<IntegratedPnlInput | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const template = useMemo(() => getIndustryPnlTemplate(industry), [industry]);

  function revenueOverrides(): PnlValueMap {
    return Object.fromEntries(
      template.revenueLines.map((line) => {
        const parsed = Number(revenue[line.code] || 0);
        return [line.code, Number.isFinite(parsed) && parsed >= 0 ? parsed : 0];
      }),
    );
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const managerToken = localStorage.getItem("wc_manager_token");
      const companyId = localStorage.getItem("wc_company_id");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

      if (!managerToken || !companyId) {
        throw new Error("Open the client company manager session first so WedgeCLOCKin payroll can be read securely.");
      }
      if (!localStorage.getItem("wedge_books_token")) {
        throw new Error("Open WedgeBooks for this client first so the secure WedgeBooks session is available.");
      }
      if (!apiBaseUrl) throw new Error("API service is not configured.");

      const [booksState, payrollResponse] = await Promise.all([
        loadBooksCloudState(),
        fetch(`${apiBaseUrl}/api/payroll?companyId=${encodeURIComponent(companyId)}&month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${managerToken}` },
        }),
      ]);

      const payrollData = await payrollResponse.json().catch(() => []);
      if (!payrollResponse.ok) throw new Error(payrollData?.message || "WedgeCLOCKin payroll could not be loaded.");

      const payrollRecords: PayrollRecordForPnl[] = Array.isArray(payrollData) ? payrollData : [];
      const integrated = buildIntegratedPnlInput(
        industry,
        year,
        month,
        booksState.documents,
        payrollRecords,
        revenueOverrides(),
      );

      setCompanyName(localStorage.getItem("wc_company_name") || booksState.workspace?.setup?.name || "Client company");
      setIntegration(integrated);
      setResult(calculateIndustryPnl(industry, integrated.values));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Integrated P&L could not be generated.");
      setIntegration(null);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090d10] px-5 py-8 text-[#f4efe6] sm:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/wedge-i/accounts" className="text-sm font-semibold text-[#c8a467]">← Accounts Control</Link>
            <p className="mt-5 text-xs font-bold tracking-[.24em] text-[#c8a467]">WEDGE-I INTEGRATED MANAGEMENT ACCOUNTS</p>
            <h1 className="mt-2 text-4xl font-semibold text-[#f0dfbd]">Industry P&amp;L Workspace</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
              Revenue comes from the monthly sales input, expenses and direct costs from WedgeBooks, and employment cost from WedgeCLOCKin. Wedge-I applies the selected industry management-accounting structure.
            </p>
          </div>
          <Link href="/wedge-i/accounts/pnl-templates" className="rounded-full border border-[#c8a467]/30 px-5 py-2.5 text-xs font-bold text-[#ead3a8]">View 23 templates</Link>
        </div>

        <form onSubmit={generate} className="mt-7 grid gap-7 xl:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="self-start rounded-[28px] border border-white/10 bg-[#11171b] p-6 xl:sticky xl:top-6">
            <p className="text-xs font-bold tracking-[.2em] text-[#c8a467]">MONTH INPUT</p>
            <label className="mt-5 block text-xs font-semibold text-white/50">Business segment
              <select value={industry} onChange={(event) => { setIndustry(event.target.value as ManagedAccountIndustry); setRevenue({}); setResult(null); }} className={`mt-2 ${inputClass}`}>
                {MANAGED_ACCOUNT_INDUSTRIES.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-white/50">Month
                <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className={`mt-2 ${inputClass}`}>
                  {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{new Intl.DateTimeFormat("en-MY", { month: "short" }).format(new Date(2026, value - 1, 1))}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-white/50">Year
                <input type="number" min="2026" value={year} onChange={(event) => setYear(Number(event.target.value))} className={`mt-2 ${inputClass}`} />
              </label>
            </div>

            <div className="mt-6 border-t border-white/10 pt-5">
              <p className="text-xs font-bold tracking-[.16em] text-white/45">MONTHLY REVENUE</p>
              <p className="mt-2 text-xs leading-5 text-white/30">Enter management sales totals. These override receipt-level sales so the P&amp;L does not depend on every customer sale being uploaded.</p>
              <div className="mt-4 space-y-3">
                {template.revenueLines.map((line) => (
                  <label key={line.code} className="block text-xs text-white/50">{line.label}
                    <input type="number" min="0" step="0.01" value={revenue[line.code] || ""} onChange={(event) => setRevenue((current) => ({ ...current, [line.code]: event.target.value }))} placeholder="0.00" className={`mt-1.5 ${inputClass}`} />
                  </label>
                ))}
              </div>
            </div>

            {template.supportsRestaurantTenderBreakdown ? (
              <div className="mt-6 rounded-2xl border border-[#c8a467]/20 bg-[#c8a467]/5 p-4">
                <p className="text-xs font-bold text-[#e3c78e]">Restaurant pass-through fields</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="text-[11px] text-white/45">Service charge<input type="number" min="0" step="0.01" value={serviceCharge} onChange={(event) => setServiceCharge(event.target.value)} className={`mt-1 ${inputClass}`} /></label>
                  <label className="text-[11px] text-white/45">SST<input type="number" min="0" step="0.01" value={sst} onChange={(event) => setSst(event.target.value)} className={`mt-1 ${inputClass}`} /></label>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-white/35">Captured separately for reconciliation/tax treatment and not automatically treated as operating revenue.</p>
              </div>
            ) : null}

            {error ? <div className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-xs leading-5 text-red-200">{error}</div> : null}
            <button disabled={busy} className="mt-6 w-full rounded-xl bg-[#c8a467] px-5 py-3.5 text-sm font-bold text-[#111416] disabled:opacity-50">{busy ? "READING WEDGE DATA..." : "GENERATE INTEGRATED P&L"}</button>
          </aside>

          <section className="min-w-0">
            {!result ? (
              <div className="grid min-h-[520px] place-items-center rounded-[28px] border border-dashed border-white/10 bg-[#11171b]/60 p-8 text-center">
                <div><div className="text-5xl">W</div><h2 className="mt-4 text-2xl font-semibold text-[#f0dfbd]">Ready for {monthName(month, year)}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-white/40">Wedge-I will combine the client&apos;s WedgeBooks documents, issued CLOCKin payroll and your monthly sales totals into the selected industry P&amp;L.</p></div>
              </div>
            ) : (
              <div className="space-y-6">
                <section className="rounded-[28px] border border-[#c8a467]/20 bg-[#11171b] p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="text-xs font-bold tracking-[.2em] text-[#c8a467]">MANAGEMENT P&amp;L</p><h2 className="mt-2 text-3xl font-semibold text-[#f0dfbd]">{companyName}</h2><p className="mt-2 text-sm text-white/40">{monthName(month, year)} · {industry}</p></div>
                    <div className="rounded-xl border border-white/10 bg-white/[.03] px-4 py-3 text-right"><p className="text-[10px] uppercase tracking-[.14em] text-white/30">Profit before tax</p><p className={`mt-1 text-2xl font-bold ${result.totals.profitBeforeTax >= 0 ? "text-emerald-200" : "text-red-200"}`}>{money(result.totals.profitBeforeTax)}</p><p className="text-xs text-white/35">{result.totals.profitBeforeTaxMarginPercent.toFixed(1)}%</p></div>
                  </div>
                  <div className="mt-6 grid gap-3 sm:grid-cols-4">
                    <Metric label="Revenue" value={money(result.totals.revenue)} />
                    <Metric label="Gross profit" value={money(result.totals.grossProfit)} sub={`${result.totals.grossMarginPercent.toFixed(1)}% GM`} />
                    <Metric label="Operating expenses" value={money(result.totals.operatingExpenses)} />
                    <Metric label="Operating profit" value={money(result.totals.operatingProfit)} sub={`${result.totals.operatingMarginPercent.toFixed(1)}% margin`} />
                  </div>
                </section>

                <PnlBlock title="Revenue" lines={result.revenueLines} total={result.totals.revenue} />
                <PnlBlock title="Direct Cost / Cost of Sales" lines={result.directCostLines} total={result.totals.directCost} footerLabel="Gross Profit" footerValue={result.totals.grossProfit} />
                <PnlBlock title="Operating Expenses" lines={result.operatingExpenseLines.filter((line) => !["other_income", "finance_cost", "other_non_operating"].includes(line.group))} total={result.totals.operatingExpenses} footerLabel="Operating Profit" footerValue={result.totals.operatingProfit} />

                {integration ? (
                  <section className="grid gap-5 lg:grid-cols-2">
                    <div className="rounded-[24px] border border-white/10 bg-[#11171b] p-5"><p className="text-xs font-bold tracking-[.18em] text-[#c8a467]">DATA COVERAGE</p><div className="mt-4 grid grid-cols-2 gap-3"><Mini label="Books docs" value={integration.stats.bookDocuments} /><Mini label="Purchases" value={integration.stats.purchaseDocuments} /><Mini label="Sales docs" value={integration.stats.salesDocuments} /><Mini label="Issued payroll" value={integration.stats.issuedPayrollRecords} /></div></div>
                    <div className={`rounded-[24px] border p-5 ${integration.warnings.length ? "border-amber-300/20 bg-amber-300/5" : "border-emerald-400/20 bg-emerald-400/5"}`}><p className="text-xs font-bold tracking-[.18em] text-[#c8a467]">WEDGE-I REVIEW</p>{integration.warnings.length ? <div className="mt-4 space-y-2">{integration.warnings.map((warning) => <p key={warning} className="text-xs leading-5 text-amber-100/70">• {warning}</p>)}</div> : <p className="mt-4 text-sm text-emerald-100/70">No integration exceptions detected for this draft.</p>}</div>
                  </section>
                ) : null}

                {template.supportsRestaurantTenderBreakdown ? <div className="rounded-2xl border border-white/10 bg-[#11171b] p-5 text-xs text-white/45">Service charge captured: <b className="text-white/70">{money(Number(serviceCharge || 0))}</b> · SST captured: <b className="text-white/70">{money(Number(sst || 0))}</b>. These remain separate for bank/tax reconciliation.</div> : null}
              </div>
            )}
          </section>
        </form>
      </div>
    </main>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-xl border border-white/8 bg-white/[.025] p-4"><p className="text-[10px] uppercase tracking-[.12em] text-white/30">{label}</p><p className="mt-2 text-lg font-bold text-[#f0dfbd]">{value}</p>{sub ? <p className="mt-1 text-[11px] text-white/35">{sub}</p> : null}</div>;
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-white/[.03] p-3"><p className="text-[10px] uppercase text-white/30">{label}</p><p className="mt-1 text-xl font-bold text-[#f0dfbd]">{value}</p></div>;
}

function PnlBlock({ title, lines, total, footerLabel, footerValue }: { title: string; lines: CalculatedIndustryPnl["revenueLines"]; total: number; footerLabel?: string; footerValue?: number }) {
  return <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#11171b]"><div className="border-b border-white/10 px-6 py-4"><h3 className="font-semibold text-[#f0dfbd]">{title}</h3></div><div>{lines.map((line) => <div key={line.code} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-white/[.05] px-6 py-3 text-sm"><span className="text-white/60">{line.label}</span><span className="w-16 text-right text-xs text-white/30">{line.percentOfRevenue.toFixed(1)}%</span><span className="w-32 text-right text-white/75">{money(line.amount)}</span></div>)}</div><div className="flex items-center justify-between bg-white/[.025] px-6 py-4 font-semibold"><span>Total {title}</span><span>{money(total)}</span></div>{footerLabel && typeof footerValue === "number" ? <div className="flex items-center justify-between border-t border-[#c8a467]/20 bg-[#c8a467]/5 px-6 py-4 font-bold text-[#f0dfbd]"><span>{footerLabel}</span><span>{money(footerValue)}</span></div> : null}</section>;
}
