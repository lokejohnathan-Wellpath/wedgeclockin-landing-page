"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ownerReportRequest, ownerToken } from "../../lib/ownerAccess";
import { calculateIndustryPnl, type PnlValueMap } from "../../wedge-i/accounts/pnlEngine";
import type { ManagedAccountIndustry } from "../../wedge-i/accounts/types";

type Report = {
  period: string;
  year: number;
  month: number;
  industry: string;
  values: PnlValueMap;
  warnings: string[];
  closedAt: string;
  status: "closed";
};

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value);
}

function periodLabel(report: Report) {
  return new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" }).format(new Date(report.year, report.month - 1, 1));
}

export default function ClientPnlPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!ownerToken()) {
        router.replace("/client-login");
        return;
      }
      try {
        const result = await ownerReportRequest<{ success: true; reports: Report[] }>("/pnl?limit=24");
        if (cancelled) return;
        setReports(result.reports || []);
        if (result.reports?.length) setSelectedPeriod(result.reports[0].period);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Management P&L could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [router]);

  const selected = reports.find((report) => report.period === selectedPeriod) || reports[0] || null;
  const calculated = useMemo(() => {
    if (!selected) return null;
    try {
      return calculateIndustryPnl(selected.industry as ManagedAccountIndustry, selected.values || {});
    } catch {
      return null;
    }
  }, [selected]);

  return (
    <main className="min-h-screen bg-[#f6f2e9] px-5 py-8 text-[#20282c] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/client-dashboard" className="text-sm font-semibold text-[#8b692f]">← Client Dashboard</Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-[#a07b3e]">REVIEWED MANAGEMENT ACCOUNTS</p>
            <h1 className="mt-2 font-serif text-4xl">Management P&amp;L</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667074]">Only months closed by the Wedge accounts workflow appear here. Draft or unreconciled figures are never shown as final client reports.</p>
          </div>
          {reports.length ? <select value={selectedPeriod} onChange={(event) => setSelectedPeriod(event.target.value)} className="rounded-xl border border-[#20282c]/15 bg-white px-4 py-3 text-sm font-semibold outline-none">{reports.map((report) => <option key={report.period} value={report.period}>{periodLabel(report)}</option>)}</select> : null}
        </div>

        {loading ? <section className="mt-8 rounded-[28px] border border-[#d8d0c2] bg-white p-10 text-center">Loading reviewed reports…</section> : null}
        {!loading && error ? <section className="mt-8 rounded-[28px] border border-amber-300/30 bg-amber-50 p-8 text-sm text-amber-900">{error}</section> : null}
        {!loading && !error && !selected ? (
          <section className="mt-8 rounded-[28px] border border-dashed border-[#b99152]/35 bg-white p-10 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#20282c] font-black text-[#efd9ae]">W</div>
            <h2 className="mt-5 text-2xl font-bold">No reviewed P&amp;L is available yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#667074]">Your Wedge accounts team will publish the month here after books, payroll and bank reconciliation are reviewed and the month is closed.</p>
          </section>
        ) : null}

        {selected && calculated ? (
          <div className="mt-8 space-y-6">
            <section className="rounded-[30px] border border-[#d8d0c2] bg-white p-7 shadow-[0_24px_70px_rgba(32,40,44,.06)] sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a07b3e]">CLOSED · REVIEWED</p>
                  <h2 className="mt-2 font-serif text-4xl">{periodLabel(selected)}</h2>
                  <p className="mt-2 text-sm text-[#667074]">{selected.industry} · closed {new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(new Date(selected.closedAt))}</p>
                </div>
                <div className="rounded-2xl bg-[#f3efe7] px-5 py-4 text-right"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#7a8385]">Profit before tax</p><p className={`mt-1 text-2xl font-bold ${calculated.totals.profitBeforeTax >= 0 ? "text-[#41755f]" : "text-[#a34f48]"}`}>{money(calculated.totals.profitBeforeTax)}</p><p className="text-xs text-[#667074]">{calculated.totals.profitBeforeTaxMarginPercent.toFixed(1)}%</p></div>
              </div>

              <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Revenue" value={money(calculated.totals.revenue)} />
                <Metric label="Gross Profit" value={money(calculated.totals.grossProfit)} sub={`${calculated.totals.grossMarginPercent.toFixed(1)}% gross margin`} />
                <Metric label="Operating Expenses" value={money(calculated.totals.operatingExpenses)} />
                <Metric label="Operating Profit" value={money(calculated.totals.operatingProfit)} sub={`${calculated.totals.operatingMarginPercent.toFixed(1)}% operating margin`} />
              </div>
            </section>

            <PnlBlock title="Revenue" lines={calculated.revenueLines} total={calculated.totals.revenue} />
            <PnlBlock title="Direct Cost / Cost of Sales" lines={calculated.directCostLines} total={calculated.totals.directCost} footerLabel="Gross Profit" footerValue={calculated.totals.grossProfit} />
            <PnlBlock title="Operating Expenses" lines={calculated.operatingExpenseLines.filter((line) => !["other_income", "finance_cost", "other_non_operating"].includes(line.group))} total={calculated.totals.operatingExpenses} footerLabel="Operating Profit" footerValue={calculated.totals.operatingProfit} />

            <section className="rounded-[24px] border border-[#d8d0c2] bg-[#fffdf8] p-6 text-sm leading-6 text-[#667074]">
              <b className="text-[#20282c]">Management view:</b> this report is prepared for business management and month-end review. Supporting source records remain in the relevant WedgeBooks and WedgeCLOCKin workspaces.
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return <div className="rounded-2xl border border-[#ded8ce] bg-[#faf8f3] p-4"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#7a8385]">{label}</p><p className="mt-2 text-xl font-bold">{value}</p>{sub ? <p className="mt-1 text-xs text-[#667074]">{sub}</p> : null}</div>;
}

function PnlBlock({ title, lines, total, footerLabel, footerValue }: { title: string; lines: Array<{ code: string; label: string; value: number }>; total: number; footerLabel?: string; footerValue?: number }) {
  return <section className="overflow-hidden rounded-[26px] border border-[#d8d0c2] bg-white"><div className="flex items-center justify-between border-b border-[#e6e0d6] px-6 py-4"><h3 className="font-bold">{title}</h3><b>{money(total)}</b></div><div className="divide-y divide-[#eee9e0]">{lines.filter((line) => Math.abs(line.value) > 0.004).map((line) => <div key={line.code} className="flex items-center justify-between gap-5 px-6 py-3 text-sm"><span className="text-[#667074]">{line.label}</span><span className="font-semibold">{money(line.value)}</span></div>)}</div>{footerLabel && footerValue !== undefined ? <div className="flex items-center justify-between border-t border-[#d8d0c2] bg-[#f8f5ef] px-6 py-4"><b>{footerLabel}</b><b>{money(footerValue)}</b></div> : null}</section>;
}
