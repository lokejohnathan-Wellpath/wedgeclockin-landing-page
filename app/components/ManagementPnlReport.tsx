"use client";

import JSZip from "jszip";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { loadOwnerSession, ownerReportRequest, ownerToken } from "../lib/ownerAccess";
import { calculateIndustryPnl, type CalculatedIndustryPnl, type PnlValueMap } from "../wedge-i/accounts/pnlEngine";
import { MANAGED_ACCOUNT_INDUSTRIES, type ManagedAccountIndustry } from "../wedge-i/accounts/types";

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

type Props = {
  backHref: string;
  backLabel: string;
  eyebrow?: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value);
}

function periodLabel(report: Report) {
  return new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" }).format(new Date(report.year, report.month - 1, 1));
}

function isIndustry(value: string): value is ManagedAccountIndustry {
  return (MANAGED_ACCOUNT_INDUSTRIES as readonly string[]).includes(value);
}

function xml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wordParagraph(text: string, options: { bold?: boolean; size?: number; after?: number } = {}) {
  const { bold = false, size = 22, after = 120 } = options;
  return `<w:p><w:pPr><w:spacing w:after="${after}"/></w:pPr><w:r><w:rPr>${bold ? "<w:b/>" : ""}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${xml(text)}</w:t></w:r></w:p>`;
}

function wordTable(rows: Array<[string, string, string?]>) {
  const border = `<w:tblBorders><w:top w:val="single" w:sz="4" w:color="D8D0C2"/><w:left w:val="single" w:sz="4" w:color="D8D0C2"/><w:bottom w:val="single" w:sz="4" w:color="D8D0C2"/><w:right w:val="single" w:sz="4" w:color="D8D0C2"/><w:insideH w:val="single" w:sz="4" w:color="E8E1D5"/><w:insideV w:val="single" w:sz="4" w:color="E8E1D5"/></w:tblBorders>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>${border}</w:tblPr>${rows.map(([label, amount, percent]) => `<w:tr><w:tc><w:tcPr><w:tcW w:w="6200" w:type="dxa"/></w:tcPr>${wordParagraph(label, { size: 20, after: 0 })}</w:tc><w:tc><w:tcPr><w:tcW w:w="2200" w:type="dxa"/></w:tcPr>${wordParagraph(amount, { bold: true, size: 20, after: 0 })}</w:tc>${percent !== undefined ? `<w:tc><w:tcPr><w:tcW w:w="1600" w:type="dxa"/></w:tcPr>${wordParagraph(percent, { size: 18, after: 0 })}</w:tc>` : ""}</w:tr>`).join("")}</w:tbl>`;
}

async function buildWordDocument(companyName: string, report: Report, calculated: CalculatedIndustryPnl) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.folder("_rels")?.file(".rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);

  const visible = (lines: CalculatedIndustryPnl["revenueLines"]) => lines.filter((line) => Math.abs(line.amount) > 0.004);
  const section = (title: string, lines: CalculatedIndustryPnl["revenueLines"], totalLabel: string, total: number) => [
    wordParagraph(title, { bold: true, size: 28, after: 100 }),
    wordTable([
      ...visible(lines).map((line): [string, string, string] => [line.label, money(line.amount), `${line.percentOfRevenue.toFixed(1)}%`]),
      [totalLabel, money(total), ""],
    ]),
    wordParagraph("", { after: 160 }),
  ].join("");

  const body = [
    wordParagraph("WEDGE-I MANAGEMENT P&L", { bold: true, size: 34, after: 80 }),
    wordParagraph(companyName, { bold: true, size: 30, after: 60 }),
    wordParagraph(`${periodLabel(report)} · ${report.industry}`, { size: 22, after: 60 }),
    wordParagraph(`Closed ${new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(new Date(report.closedAt))}`, { size: 18, after: 200 }),
    wordParagraph("Management Summary", { bold: true, size: 28, after: 100 }),
    wordTable([
      ["Revenue", money(calculated.totals.revenue), ""],
      ["Gross Profit", money(calculated.totals.grossProfit), `${calculated.totals.grossMarginPercent.toFixed(1)}%`],
      ["Operating Expenses", money(calculated.totals.operatingExpenses), ""],
      ["Operating Profit", money(calculated.totals.operatingProfit), `${calculated.totals.operatingMarginPercent.toFixed(1)}%`],
      ["Profit Before Tax", money(calculated.totals.profitBeforeTax), `${calculated.totals.profitBeforeTaxMarginPercent.toFixed(1)}%`],
    ]),
    wordParagraph("", { after: 180 }),
    section("Revenue", calculated.revenueLines, "Total Revenue", calculated.totals.revenue),
    section("Direct Cost / Cost of Sales", calculated.directCostLines, "Total Direct Cost", calculated.totals.directCost),
    section("Operating Expenses", calculated.operatingExpenseLines.filter((line) => !["other_income", "finance_cost", "other_non_operating"].includes(line.group)), "Total Operating Expenses", calculated.totals.operatingExpenses),
    wordParagraph(`Gross Profit: ${money(calculated.totals.grossProfit)}`, { bold: true, size: 22, after: 60 }),
    wordParagraph(`Operating Profit: ${money(calculated.totals.operatingProfit)}`, { bold: true, size: 22, after: 60 }),
    wordParagraph(`Profit Before Tax: ${money(calculated.totals.profitBeforeTax)}`, { bold: true, size: 22, after: 180 }),
    wordParagraph("Management view: this report is prepared for business management and month-end review. Supporting source records remain in WedgeBooks and WedgeCLOCKin.", { size: 18, after: 80 }),
  ].join("");

  zip.folder("word")?.file("document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`);

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

export default function ManagementPnlReport({ backHref, backLabel, eyebrow = "REVIEWED MANAGEMENT ACCOUNTS" }: Props) {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [companyName, setCompanyName] = useState("My Business");
  const [loading, setLoading] = useState(true);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!ownerToken()) {
        router.replace("/client-login");
        return;
      }
      try {
        const [reportResult, sessionResult] = await Promise.all([
          ownerReportRequest<{ success: true; reports: Report[] }>("/pnl?limit=24"),
          loadOwnerSession(),
        ]);
        if (cancelled) return;
        setReports(reportResult.reports || []);
        setCompanyName(sessionResult.business.tradingName || sessionResult.business.legalName || "My Business");
        if (reportResult.reports?.length) setSelectedPeriod(reportResult.reports[0].period);
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
    if (!selected || !isIndustry(selected.industry)) return null;
    return calculateIndustryPnl(selected.industry, selected.values || {});
  }, [selected]);

  async function downloadWord() {
    if (!selected || !calculated) return;
    setDownloadBusy(true);
    setError("");
    try {
      const blob = await buildWordDocument(companyName, selected, calculated);
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `Wedge-Management-PnL-${selected.period}.docx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Word report could not be generated.");
    } finally {
      setDownloadBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f2e9] px-5 py-8 text-[#20282c] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href={backHref} className="text-sm font-semibold text-[#8b692f]">← {backLabel}</Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[.2em] text-[#a07b3e]">{eyebrow}</p>
            <h1 className="mt-2 font-serif text-4xl">Management P&amp;L</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667074]">Only months closed by the Wedge accounts workflow appear here. Draft or unreconciled figures are never shown as final client reports.</p>
          </div>
          {reports.length ? <div className="flex flex-wrap gap-2"><select value={selectedPeriod} onChange={(event) => setSelectedPeriod(event.target.value)} className="rounded-xl border border-[#20282c]/15 bg-white px-4 py-3 text-sm font-semibold outline-none">{reports.map((report) => <option key={report.period} value={report.period}>{periodLabel(report)}</option>)}</select><button type="button" onClick={() => void downloadWord()} disabled={downloadBusy || !calculated} className="rounded-xl bg-[#20282c] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{downloadBusy ? "Generating Word…" : "Download Word (.docx)"}</button></div> : null}
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
        {!loading && selected && !calculated ? <section className="mt-8 rounded-[28px] border border-amber-300/30 bg-amber-50 p-8 text-sm text-amber-900">This closed report uses an unsupported industry profile. Ask the Wedge accounts team to review the report classification.</section> : null}

        {selected && calculated ? (
          <div className="mt-8 space-y-6">
            <section className="rounded-[30px] border border-[#d8d0c2] bg-white p-7 shadow-[0_24px_70px_rgba(32,40,44,.06)] sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a07b3e]">CLOSED · REVIEWED</p>
                  <h2 className="mt-2 font-serif text-4xl">{companyName}</h2>
                  <p className="mt-2 text-sm text-[#667074]">{periodLabel(selected)} · {selected.industry} · closed {new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(new Date(selected.closedAt))}</p>
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

function PnlBlock({ title, lines, total, footerLabel, footerValue }: { title: string; lines: CalculatedIndustryPnl["revenueLines"]; total: number; footerLabel?: string; footerValue?: number }) {
  const visible = lines.filter((line) => Math.abs(line.amount) > 0.004);
  return <section className="overflow-hidden rounded-[26px] border border-[#d8d0c2] bg-white"><div className="flex items-center justify-between border-b border-[#e6e0d6] px-6 py-4"><h3 className="font-bold">{title}</h3><b>{money(total)}</b></div><div className="divide-y divide-[#eee9e0]">{visible.length ? visible.map((line) => <div key={line.code} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-6 py-3 text-sm"><span className="text-[#667074]">{line.label}</span><span className="text-xs text-[#92999b]">{line.percentOfRevenue.toFixed(1)}%</span><span className="font-semibold">{money(line.amount)}</span></div>) : <p className="px-6 py-4 text-sm text-[#92999b]">No amount recorded.</p>}</div>{footerLabel && footerValue !== undefined ? <div className="flex items-center justify-between border-t border-[#d8d0c2] bg-[#f8f5ef] px-6 py-4"><b>{footerLabel}</b><b>{money(footerValue)}</b></div> : null}</section>;
}
