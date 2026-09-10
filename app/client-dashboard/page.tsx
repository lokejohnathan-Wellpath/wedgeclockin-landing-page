"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { productToken } from "../lib/productAccess";

type ClientSession = {
  companyName: string;
  companyCode: string;
  hasBooks: boolean;
  hasClockIn: boolean;
};

export default function ClientDashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState<ClientSession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const hasBooks = Boolean(productToken("books"));
    const hasClockIn = Boolean(localStorage.getItem("wc_manager_token"));
    const companyName = localStorage.getItem("wc_company_name") || "My Business";
    const companyCode = localStorage.getItem("wc_company_code") || "";

    if (!hasBooks && !hasClockIn) {
      setChecked(true);
      return;
    }

    setSession({ companyName, companyCode, hasBooks, hasClockIn });
    setChecked(true);
  }, []);

  const subtitle = useMemo(() => {
    if (!session) return "";
    return session.companyCode ? `Company ${session.companyCode}` : "Managed business workspace";
  }, [session]);

  if (!checked) {
    return <main className="grid min-h-screen place-items-center bg-[#f6f2e9] text-[#20282c]">Opening your business workspace…</main>;
  }

  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f6f2e9] px-6 text-[#20282c]">
        <section className="w-full max-w-lg rounded-[28px] border border-[#d8d0c2] bg-white p-8 text-center shadow-[0_24px_70px_rgba(32,40,44,.08)]">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#20282c] font-black text-[#efd9ae]">W</div>
          <h1 className="mt-5 font-serif text-3xl">Client workspace</h1>
          <p className="mt-3 text-sm leading-6 text-[#667074]">Sign in to your WedgeBooks or WedgeCLOCKin manager account to open your business workspace.</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link href="/wedge-i/books/login" className="rounded-xl bg-[#20282c] px-5 py-3 text-sm font-bold text-white">WedgeBooks Login</Link>
            <Link href="/manager-login" className="rounded-xl border border-[#20282c]/15 px-5 py-3 text-sm font-bold">WedgeCLOCKin Login</Link>
          </div>
          <Link href="/wedge-i" className="mt-5 inline-block text-sm font-semibold text-[#87682f]">Open free Wedge-I</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f2e9] text-[#20282c]">
      <header className="border-b border-[#d8d0c2] bg-[#fbf9f4]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/wedge-i" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#20282c] font-black text-[#efd9ae]">W</span>
            <span>
              <span className="block text-sm font-black tracking-[.12em]">WEDGE-I</span>
              <span className="block text-[11px] text-[#667074]">Client Business Dashboard</span>
            </span>
          </Link>
          <div className="rounded-full border border-[#b99152]/25 bg-[#b99152]/10 px-4 py-2 text-xs font-bold text-[#765d2f]">Managed business workspace</div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section className="rounded-[30px] border border-[#d8d0c2] bg-white p-7 shadow-[0_24px_70px_rgba(32,40,44,.07)] sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#a07b3e]">YOUR BUSINESS</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl">{session.companyName}</h1>
              <p className="mt-2 text-sm text-[#667074]">{subtitle}</p>
            </div>
            <Link href="/wedge-i" className="rounded-full bg-[#20282c] px-5 py-3 text-sm font-bold text-white">Open Wedge-I Intelligence</Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <WorkspaceCard title="Wedge-I" eyebrow="BUSINESS INTELLIGENCE" body="Understand performance, risks and priorities without accounting jargon." href="/wedge-i" action="Open intelligence" enabled />
          <WorkspaceCard title="WedgeBooks" eyebrow="BOOKS & DOCUMENTS" body="Receipts, purchases, bookkeeping records and source documents." href="/wedge-i/books" action={session.hasBooks ? "Open WedgeBooks" : "Not activated"} enabled={session.hasBooks} />
          <WorkspaceCard title="WedgeCLOCKin" eyebrow="STAFF & ATTENDANCE" body="Employees, attendance, leave, overtime and payroll operations." href="/manager-dashboard" action={session.hasClockIn ? "Open CLOCKin" : "Not activated"} enabled={session.hasClockIn} />
          <WorkspaceCard title="My Reports" eyebrow="MANAGEMENT ACCOUNTS" body="Your reviewed management P&L and month-end reports appear here when available." href="#reports" action="View reports" enabled />
        </section>

        <section id="reports" className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-[26px] border border-[#d8d0c2] bg-white p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a07b3e]">ACCOUNTS THIS MONTH</p>
                <h2 className="mt-2 text-2xl font-bold">Month-end progress</h2>
              </div>
              <span className="rounded-full bg-[#f1eee7] px-3 py-2 text-xs font-semibold text-[#667074]">Live status will come from your managed-account record</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Status label="Books" active={session.hasBooks} />
              <Status label="Payroll" active={session.hasClockIn} />
              <Status label="Bank" active={false} neutral />
              <Status label="P&L" active={false} neutral />
            </div>
            <p className="mt-5 text-sm leading-6 text-[#667074]">This dashboard intentionally does not invent financial figures. Revenue, margin, bank reconciliation and P&L status will display only when the backend returns that client’s actual data.</p>
          </div>

          <aside className="rounded-[26px] border border-[#d8d0c2] bg-[#fffdf8] p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a07b3e]">HUMAN SUPPORT</p>
            <h2 className="mt-2 font-serif text-3xl">Need help with the numbers?</h2>
            <p className="mt-3 text-sm leading-6 text-[#667074]">Your Wedge accounts team can help with documents, bank reconciliation and month-end questions.</p>
            <button type="button" className="mt-6 w-full rounded-xl bg-[#b99152] px-5 py-3 text-sm font-bold text-white">Talk to Wedge</button>
          </aside>
        </section>
      </div>
    </main>
  );
}

function WorkspaceCard({ title, eyebrow, body, href, action, enabled }: { title: string; eyebrow: string; body: string; href: string; action: string; enabled: boolean }) {
  const content = (
    <div className="h-full rounded-[24px] border border-[#d8d0c2] bg-white p-6 shadow-[0_16px_45px_rgba(32,40,44,.05)]">
      <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[#a07b3e]">{eyebrow}</p>
      <h2 className="mt-3 text-2xl font-bold">{title}</h2>
      <p className="mt-3 min-h-16 text-sm leading-6 text-[#667074]">{body}</p>
      <span className={`mt-5 inline-flex rounded-full px-4 py-2 text-xs font-bold ${enabled ? "bg-[#20282c] text-white" : "bg-[#eeeae2] text-[#8b8b84]"}`}>{action}</span>
    </div>
  );

  return enabled && href !== "#reports" ? <Link href={href}>{content}</Link> : href === "#reports" ? <a href={href}>{content}</a> : content;
}

function Status({ label, active, neutral = false }: { label: string; active: boolean; neutral?: boolean }) {
  const text = neutral ? "Awaiting data" : active ? "Connected" : "Not activated";
  return <div className="rounded-2xl border border-[#ded8ce] bg-[#faf8f3] p-4"><p className="text-xs font-bold text-[#667074]">{label}</p><p className={`mt-2 text-sm font-bold ${neutral ? "text-[#997a44]" : active ? "text-[#41755f]" : "text-[#8a6b63]"}`}>{text}</p></div>;
}
