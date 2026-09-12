"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { founderRequest } from "../lib/founderApi";

type Workspace = {
  success: true;
  business: {
    businessId: string;
    companyCode: string;
    legalName: string;
    tradingName?: string;
    industry: string;
    assignedAccountsExecutive?: string;
  };
  period: string;
  month: {
    sales: string;
    documents: string;
    payroll: string;
    books: string;
    bankReconciliation: string;
    pnl: string;
    lockedAt?: string | null;
    reconciliationDifference: number;
    bankExceptionCount: number;
    missingDocumentCount: number;
    bankStatementCount: number;
    accountingItems: Array<{
      id: string;
      type: string;
      status: string;
      counterparty?: string;
      amount?: number;
      note?: string;
      blocksClose?: boolean;
    }>;
  };
  stats: {
    documentCount: number;
    reviewDocumentCount: number;
    activeEmployees: number;
    payrollRecords: number;
    issuedPayroll: number;
    draftPayroll: number;
    blockingItems: number;
    outstandingPayables: number;
  };
};

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value || 0);
}

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function WedgeIInternalPage() {
  const router = useRouter();
  const [businessId, setBusinessId] = useState("");
  const [period, setPeriod] = useState(currentPeriod());
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("businessId") || "";
    if (!id) {
      router.replace("/founder-john-control/businesses");
      return;
    }
    setBusinessId(id);
  }, [router]);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    founderRequest<Workspace>(`/api/founder/control/businesses/${encodeURIComponent(businessId)}/workspace?period=${encodeURIComponent(period)}`)
      .then((result) => { if (!cancelled) setWorkspace(result); })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "Workspace could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [businessId, period]);

  const openItems = useMemo(() => workspace?.month.accountingItems.filter((item) => item.status === "open") || [], [workspace]);

  if (loading || !workspace) {
    return <main className="grid min-h-[70vh] place-items-center bg-[#090d10] px-6 text-center text-[#f4efe6]">{error || "Loading Wedge-I business control…"}</main>;
  }

  const name = workspace.business.tradingName || workspace.business.legalName;
  const suffix = `businessId=${encodeURIComponent(workspace.business.businessId)}`;
  const closeReady = workspace.month.bankStatementCount > 0 && Math.abs(workspace.month.reconciliationDifference) <= 0.005 && workspace.stats.blockingItems === 0 && workspace.stats.draftPayroll === 0 && workspace.stats.issuedPayroll >= workspace.stats.activeEmployees && workspace.month.pnl !== "not_started";

  return (
    <main className="min-h-screen bg-[#090d10] px-5 py-8 text-[#f4efe6] sm:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-bold tracking-[.22em] text-[#c8a467]">WEDGE-I · MANAGED BUSINESS CONTROL</p><h1 className="mt-2 text-4xl font-semibold text-[#f0dfbd]">{name}</h1><p className="mt-2 text-sm text-white/45">{workspace.business.companyCode} · {workspace.business.businessId} · {workspace.business.industry}</p></div>
          <label className="text-xs font-semibold text-white/45">Month<input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="ml-3 rounded-xl border border-white/10 bg-[#11171b] px-4 py-2.5 text-sm text-white" /></label>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatusCard title="Books" status={workspace.month.books} detail={`${workspace.stats.documentCount} documents`} />
          <StatusCard title="Payroll" status={workspace.month.payroll} detail={`${workspace.stats.issuedPayroll} issued · ${workspace.stats.draftPayroll} draft`} />
          <StatusCard title="Sales" status={workspace.month.sales} detail="Monthly sales input" />
          <StatusCard title="Bank" status={workspace.month.bankReconciliation} detail={`${workspace.month.bankStatementCount} statement(s)`} />
          <StatusCard title="Exceptions" status={workspace.stats.blockingItems ? "review_required" : "ready"} detail={`${workspace.stats.blockingItems} blocking`} />
          <StatusCard title="P&L" status={workspace.month.pnl} detail={workspace.month.lockedAt ? "Month closed" : "Working month"} />
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[28px] border border-white/10 bg-[#11171b] p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold tracking-[.18em] text-[#c8a467]">WHAT NEEDS WORK</p><h2 className="mt-2 text-2xl font-semibold text-[#f0dfbd]">Month-end control</h2></div><span className={`rounded-full px-4 py-2 text-xs font-bold ${closeReady ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-300/10 text-amber-100"}`}>{closeReady ? "READY FOR FINAL REVIEW" : "WORK IN PROGRESS"}</span></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Check ok={workspace.stats.reviewDocumentCount === 0} text={`${workspace.stats.reviewDocumentCount} document(s) need bookkeeping review`} />
              <Check ok={workspace.stats.draftPayroll === 0 && workspace.stats.issuedPayroll >= workspace.stats.activeEmployees} text={`${workspace.stats.draftPayroll} payroll draft(s) still need review / issue`} />
              <Check ok={workspace.month.bankStatementCount > 0} text={workspace.month.bankStatementCount ? "Bank statement received" : "Bank statement not received"} />
              <Check ok={Math.abs(workspace.month.reconciliationDifference) <= 0.005} text={`Bank difference ${money(workspace.month.reconciliationDifference)}`} />
              <Check ok={workspace.stats.blockingItems === 0} text={`${workspace.stats.blockingItems} material exception(s) block close`} />
              <Check ok={workspace.month.pnl !== "not_started"} text={workspace.month.pnl === "not_started" ? "P&L not generated" : `P&L ${workspace.month.pnl.replaceAll("_", " ")}`} />
            </div>
          </div>

          <aside className="rounded-[28px] border border-[#c8a467]/20 bg-[#12181c] p-6 sm:p-7"><p className="text-xs font-bold tracking-[.18em] text-[#c8a467]">CARRY-FORWARD ITEMS</p><div className="mt-4 text-3xl font-semibold text-[#f0dfbd]">{money(workspace.stats.outstandingPayables)}</div><p className="mt-1 text-sm text-white/40">Outstanding supplier payables. These do not block month close when the expense is properly recorded.</p><div className="mt-5 space-y-2">{openItems.slice(0, 5).map((item) => <div key={item.id} className="rounded-xl border border-white/[.06] bg-white/[.025] p-3 text-xs text-white/55"><div className="flex justify-between gap-3"><b className="capitalize text-white/75">{item.type.replaceAll("_", " ")}</b><span>{money(Number(item.amount || 0))}</span></div><p className="mt-1">{item.counterparty || item.note || "Review item"}{item.blocksClose ? " · BLOCKS CLOSE" : ""}</p></div>)}{!openItems.length ? <p className="text-sm text-white/35">No open accounting items.</p> : null}</div></aside>
        </section>

        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Action title="WedgeBooks" body="Review client captures, classify expenses and maintain books." href={`/wedge-i/books?${suffix}`} />
          <Action title="Payroll" body="Review automatic month-end payroll drafts, statutory amounts and issue the month." href={`/wedge-i/payroll?${suffix}`} />
          <Action title="Reconciliation" body="Review bank statement status, exceptions, payables and accruals." href={`/wedge-i/accounts/reconciliation?${suffix}`} />
          <Action title="Accounting Centre" body="Post Books and payroll into the double-entry ledger, reconcile bank, review P&L / Trial Balance / Balance Sheet and export Word or Excel." href={`/wedge-i/accounts/accounting?${suffix}&period=${encodeURIComponent(period)}`} />
          <Action title="Business Registry" body="Return to all managed businesses and client setup." href="/founder-john-control/businesses" />
        </section>

        <section className="mt-7 rounded-[26px] border border-white/10 bg-[#0e1417] p-6 text-sm leading-6 text-white/45"><b className="text-[#e3c78e]">Operating rule:</b> a month closes when the accounts are reasonably complete and explainable. Properly recorded unpaid suppliers, accruals and timing differences may remain open and carry forward. Unknown material transactions and unresolved duplicates remain blocking exceptions.</section>
      </div>
    </main>
  );
}

function StatusCard({ title, status, detail }: { title: string; status: string; detail: string }) { const good = ["ready", "complete", "reconciled", "closed"].includes(status); return <div className="rounded-2xl border border-white/10 bg-[#11171b] p-5"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-white/30">{title}</p><p className={`mt-2 text-sm font-bold capitalize ${good ? "text-emerald-200" : "text-amber-100"}`}>{status.replaceAll("_", " ")}</p><p className="mt-2 text-xs text-white/35">{detail}</p></div>; }
function Check({ ok, text }: { ok: boolean; text: string }) { return <div className="flex gap-3 rounded-xl border border-white/[.06] bg-white/[.025] p-4 text-sm text-white/55"><span className={ok ? "text-emerald-300" : "text-amber-200"}>{ok ? "✓" : "!"}</span><span>{text}</span></div>; }
function Action({ title, body, href }: { title: string; body: string; href: string }) { return <Link href={href} className="rounded-[24px] border border-white/10 bg-[#11171b] p-6 hover:border-[#c8a467]/35"><p className="text-xs font-bold tracking-[.16em] text-[#c8a467]">{title.toUpperCase()}</p><p className="mt-3 text-sm leading-6 text-white/45">{body}</p><span className="mt-5 inline-flex text-sm font-bold text-[#ead3a8]">Open →</span></Link>; }
