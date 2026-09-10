"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MANAGED_ACCOUNT_INDUSTRIES, type ManagedAccountIndustry } from "../types";
import { getIndustryPnlTemplate } from "../pnlTemplates";

export default function PnlTemplateLibraryPage() {
  const [industry, setIndustry] = useState<ManagedAccountIndustry>("F&B - Restaurant / Cafe / QSR");
  const template = useMemo(() => getIndustryPnlTemplate(industry), [industry]);

  return (
    <main className="min-h-screen bg-[#0c1012] px-5 py-8 text-[#f4efe6] sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/wedge-i/accounts" className="text-sm font-semibold text-[#c8a467] hover:text-[#ead3a8]">
              ← Accounts Control
            </Link>
            <p className="mt-5 text-xs font-bold tracking-[.28em] text-[#c8a467]">WEDGE-I MANAGEMENT ACCOUNTS</p>
            <h1 className="mt-2 text-4xl font-semibold text-[#f0dfbd]">Industry P&amp;L Template Library</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
              Each client receives an industry-specific management P&amp;L while every account still maps back to the same Wedge master financial schema for automation and cross-client analysis.
            </p>
          </div>
          <div className="rounded-2xl border border-[#c8a467]/25 bg-[#c8a467]/5 px-5 py-4 text-sm">
            <div className="text-xs uppercase tracking-[.18em] text-white/35">Templates available</div>
            <div className="mt-1 text-3xl font-bold text-[#e5c17d]">{MANAGED_ACCOUNT_INDUSTRIES.length}</div>
          </div>
        </div>

        <section className="mt-7 rounded-[28px] border border-white/10 bg-[#141a1e] p-6 shadow-2xl">
          <label className="block text-xs font-semibold uppercase tracking-[.18em] text-white/45">Business segment</label>
          <select
            value={industry}
            onChange={(event) => setIndustry(event.target.value as ManagedAccountIndustry)}
            className="mt-3 w-full max-w-xl rounded-xl border border-white/10 bg-[#0f1417] px-4 py-3 text-sm text-white outline-none focus:border-[#c8a467]"
          >
            {MANAGED_ACCOUNT_INDUSTRIES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <div className="mt-7 grid gap-6 lg:grid-cols-3">
            <PnlSection title="Revenue" lines={template.revenueLines.map((item) => item.label)} />
            <PnlSection title="Direct Cost / Cost of Sales" lines={template.directCostLines.map((item) => item.label)} />
            <PnlSection title="Operating Expenses" lines={template.operatingExpenseLines.map((item) => item.label)} />
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-[28px] border border-white/10 bg-[#141a1e] p-6">
            <p className="text-xs font-bold tracking-[.2em] text-[#c8a467]">MANAGEMENT STATEMENT FLOW</p>
            <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              {["Revenue", "Less: Direct Cost", "Gross Profit", "Less: Operating Expenses", "Operating Profit", "Add / Less: Other Income & Finance Cost", "Profit Before Tax", "Wedge-I Commentary & Priorities"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[.025] px-4 py-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#c8a467]/15 text-xs font-bold text-[#d8b778]">{index + 1}</span>
                  <span className="text-white/70">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#c8a467]/20 bg-[#c8a467]/5 p-6">
            <p className="text-xs font-bold tracking-[.2em] text-[#c8a467]">INDUSTRY KPIs</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {template.kpis.map((kpi) => (
                <span key={kpi} className="rounded-full border border-[#c8a467]/20 bg-[#0f1417] px-3 py-2 text-xs text-[#ead3a8]">{kpi}</span>
              ))}
            </div>
            {template.supportsRestaurantTenderBreakdown ? (
              <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-xs leading-5 text-emerald-100/70">
                Restaurant mode includes Food, Beverage, Other Sales, Service Charge and SST plus Cash, Card, QR, GrabFood, Foodpanda and other tender reconciliation.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function PnlSection({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f1417] p-5">
      <h2 className="text-sm font-bold text-[#f0dfbd]">{title}</h2>
      <div className="mt-4 space-y-2">
        {lines.map((item) => (
          <div key={item} className="flex items-center justify-between gap-4 border-b border-white/5 py-2 text-sm text-white/55 last:border-b-0">
            <span>{item}</span>
            <span className="text-white/20">RM</span>
          </div>
        ))}
      </div>
    </div>
  );
}
