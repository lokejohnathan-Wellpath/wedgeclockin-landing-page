"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearOwnerSession,
  loadOwnerSession,
  ownerToken,
  refreshOwnerProductAccess,
  type OwnerBusiness,
} from "../lib/ownerAccess";

export default function ClientDashboardPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<OwnerBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function open() {
      if (!ownerToken()) {
        router.replace("/client-login");
        return;
      }
      try {
        const session = await loadOwnerSession();
        if (!cancelled) setBusiness(session.business);
        try {
          await refreshOwnerProductAccess();
        } catch {
          // The owner session remains valid even if a product still needs provisioning.
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Client workspace could not be opened.");
          router.replace("/client-login");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void open();
    return () => { cancelled = true; };
  }, [router]);

  if (loading || !business) {
    return <main className="grid min-h-screen place-items-center bg-[#f6f2e9] px-6 text-center text-[#20282c]">{error || "Opening your business workspace…"}</main>;
  }

  const hasBooks = business.entitlements.books.enabled && business.entitlements.books.status === "active";
  const hasClockIn = business.entitlements.clockIn.enabled && business.entitlements.clockIn.status === "active";
  const hasManagedAccounts = business.entitlements.managedAccounts.enabled && business.entitlements.managedAccounts.status === "active";
  const companyName = business.tradingName || business.legalName;

  return (
    <main className="min-h-screen bg-[#f6f2e9] text-[#20282c]">
      <header className="border-b border-[#d8d0c2] bg-[#fbf9f4]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/client-dashboard" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#20282c] font-black text-[#efd9ae]">W</span>
            <span>
              <span className="block text-sm font-black tracking-[.12em]">WEDGE WORKS</span>
              <span className="block text-[11px] text-[#667074]">Client Business Dashboard</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-[#b99152]/25 bg-[#b99152]/10 px-4 py-2 text-xs font-bold text-[#765d2f]">{hasManagedAccounts ? "Managed Accounts active" : "Approved business"}</div>
            <button onClick={() => { clearOwnerSession(); router.replace("/client-login"); }} className="rounded-full border border-[#20282c]/15 px-4 py-2 text-xs font-bold">Log out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <section className="rounded-[30px] border border-[#d8d0c2] bg-white p-7 shadow-[0_24px_70px_rgba(32,40,44,.07)] sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#a07b3e]">YOUR BUSINESS</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl">{companyName}</h1>
              <p className="mt-2 text-sm text-[#667074]">Company code {business.companyCode} · Business ID {business.businessId}</p>
              <p className="mt-1 text-xs text-[#8a9294]">Signed in as {business.ownerName} · {business.ownerEmail}</p>
            </div>
            <Link href="/wedge-i" className="rounded-full bg-[#20282c] px-5 py-3 text-sm font-bold text-white">Open Wedge-I Intelligence</Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <WorkspaceCard title="Wedge-I" eyebrow="BUSINESS INTELLIGENCE" body="Understand performance, risks and priorities without accounting jargon." href="/wedge-i" action="Open intelligence" enabled />
          <WorkspaceCard title="WedgeBooks" eyebrow="BOOKS & DOCUMENTS" body="Receipts, purchases, bookkeeping records and source documents under this business identity." href="/wedge-i/books" action={hasBooks ? "Open WedgeBooks" : "Not activated"} enabled={hasBooks} />
          <WorkspaceCard title="WedgeCLOCKin" eyebrow="STAFF & PAYROLL" body="Employees, attendance, leave, overtime, payroll and operational workforce records." href="/manager-dashboard" action={hasClockIn ? "Open WedgeCLOCKin" : "Not activated"} enabled={hasClockIn} />
          <WorkspaceCard title="Management P&L" eyebrow="REVIEWED REPORTS" body="View closed monthly management P&L reports prepared from WedgeBooks, payroll, sales and reconciliation." href="/client-dashboard/pnl" action={hasManagedAccounts ? "Open P&L" : "Not activated"} enabled={hasManagedAccounts} />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
          <div className="rounded-[26px] border border-[#d8d0c2] bg-white p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a07b3e]">BUSINESS ACCESS</p>
                <h2 className="mt-2 text-2xl font-bold">One owner login, enabled services underneath.</h2>
              </div>
              <span className="rounded-full bg-[#f1eee7] px-3 py-2 text-xs font-semibold text-[#667074]">{business.companyCode}</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Status label="Wedge-I" active />
              <Status label="Books" active={hasBooks} />
              <Status label="CLOCKin" active={hasClockIn} />
              <Status label="P&L" active={hasManagedAccounts} />
            </div>
            <p className="mt-5 text-sm leading-6 text-[#667074]">Business owners use this Client Dashboard. Delegated CLOCKin managers and employees keep their own separate operational logins and do not receive WedgeBooks or management P&L access.</p>
          </div>

          <aside className="rounded-[26px] border border-[#d8d0c2] bg-[#fffdf8] p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#a07b3e]">HUMAN SUPPORT</p>
            <h2 className="mt-2 font-serif text-3xl">Need help with the numbers?</h2>
            <p className="mt-3 text-sm leading-6 text-[#667074]">{business.assignedAccountsExecutive ? `Assigned accounts executive: ${business.assignedAccountsExecutive}.` : "Your Wedge accounts team can help with documents, reconciliation and month-end questions."}</p>
            <p className="mt-5 rounded-xl bg-[#f1eee7] p-4 text-xs leading-5 text-[#667074]">You run the business. Wedge runs the back office.</p>
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
      <p className="mt-3 min-h-20 text-sm leading-6 text-[#667074]">{body}</p>
      <span className={`mt-5 inline-flex rounded-full px-4 py-2 text-xs font-bold ${enabled ? "bg-[#20282c] text-white" : "bg-[#eeeae2] text-[#8b8b84]"}`}>{action}</span>
    </div>
  );
  return enabled ? <Link href={href}>{content}</Link> : content;
}

function Status({ label, active }: { label: string; active: boolean }) {
  return <div className="rounded-2xl border border-[#ded8ce] bg-[#faf8f3] p-4"><p className="text-xs font-bold text-[#667074]">{label}</p><p className={`mt-2 text-sm font-bold ${active ? "text-[#41755f]" : "text-[#8a6b63]"}`}>{active ? "Enabled" : "Not activated"}</p></div>;
}
