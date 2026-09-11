"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FOUNDER_TOKEN_KEY, founderRequest } from "../../lib/founderApi";

type Entitlement = { enabled: boolean; status: string; activatedAt?: string | null };
type Business = {
  businessId: string;
  companyCode: string;
  legalName: string;
  tradingName?: string;
  businessType: string;
  ownerName: string;
  ownerEmail: string;
  phone?: string;
  status: string;
  ownerAccessConfigured: boolean;
  assignedAccountsExecutive?: string;
  managedProfileConfigured: boolean;
  entitlements: {
    wedgeI: Entitlement;
    managedAccounts: Entitlement;
    books: Entitlement;
    clockIn: Entitlement;
  };
  updatedAt: string;
};

export default function FounderBusinessesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem(FOUNDER_TOKEN_KEY)) {
      router.replace("/founder-john-control");
      return;
    }
    founderRequest<{ success: true; businesses: Business[] }>("/api/founder/control/businesses")
      .then((result) => setRows(result.businesses || []))
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Approved businesses could not be loaded."))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.legalName, row.tradingName || "", row.companyCode, row.businessId, row.ownerName, row.ownerEmail].some((value) => value.toLowerCase().includes(q)));
  }, [rows, search]);

  return (
    <main className="min-h-screen bg-[#080c0f] px-5 py-8 text-[#f3efe7] sm:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/founder-john-control/dashboard" className="text-sm font-semibold text-[#d2aa62]">← Founder Dashboard</Link>
            <p className="mt-6 text-xs font-bold tracking-[.22em] text-[#d2aa62]">CANONICAL BUSINESS REGISTRY</p>
            <h1 className="mt-2 font-serif text-4xl">Approved Wedge businesses</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">One record per business. This is where Founder finds the permanent Business ID, owner-access status and enabled services.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/founder-john-control/registrations" className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold">Pending Registrations</Link>
            <Link href="/wedge-i/accounts" className="rounded-xl bg-[#d2aa62] px-4 py-3 text-sm font-bold text-black">Managed Accounts</Link>
          </div>
        </div>

        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, company code, Business ID or owner" className="mt-7 w-full max-w-xl rounded-xl border border-white/10 bg-[#101619] px-4 py-3 text-sm text-white outline-none focus:border-[#d2aa62]" />
        {error ? <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p> : null}

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-[#121a1e]">
          {loading ? <p className="p-6 text-sm text-white/45">Loading approved businesses…</p> : !filtered.length ? <p className="p-8 text-center text-sm text-white/45">No approved businesses match this search.</p> : (
            <div className="divide-y divide-white/[.06]">
              {filtered.map((row) => {
                const managed = row.entitlements.managedAccounts.enabled && row.entitlements.managedAccounts.status === "active";
                return (
                  <article key={row.businessId} className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-center">
                    <div>
                      <h2 className="font-bold text-[#f1dfbc]">{row.tradingName || row.legalName}</h2>
                      <p className="mt-1 text-xs text-white/40">{row.legalName}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[11px]"><Code>{row.companyCode}</Code><Code>{row.businessId}</Code></div>
                    </div>
                    <div className="text-sm">
                      <p>{row.ownerName}</p>
                      <p className="mt-1 text-xs text-[#a8cfc9]">{row.ownerEmail}</p>
                      <p className="mt-1 text-xs text-white/35">Owner access: {row.ownerAccessConfigured ? "Ready" : "Not set up"}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <Pill active>Wedge-I</Pill>
                      <Pill active={row.entitlements.books.enabled}>Books</Pill>
                      <Pill active={row.entitlements.clockIn.enabled}>CLOCKin</Pill>
                      <Pill active={managed}>Managed</Pill>
                    </div>
                    <div className="flex flex-col gap-2 lg:min-w-48">
                      <Link href={`/wedge-i/accounts/new?businessId=${encodeURIComponent(row.businessId)}`} className="rounded-lg border border-[#d2aa62]/35 px-4 py-2 text-center text-xs font-bold text-[#f1dfbc]">{managed ? "Configure Managed Accounts" : "Activate Managed Accounts"}</Link>
                      {managed ? <Link href={`/wedge-i/accounts/pnl?businessId=${encodeURIComponent(row.businessId)}`} className="rounded-lg bg-[#d2aa62] px-4 py-2 text-center text-xs font-bold text-black">Open P&amp;L Workspace</Link> : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1 text-white/55">{children}</span>;
}

function Pill({ active, children }: { active: boolean; children: React.ReactNode }) {
  return <span className={`rounded-full px-3 py-1 font-bold ${active ? "bg-emerald-400/10 text-emerald-200" : "bg-white/[.04] text-white/30"}`}>{children}</span>;
}
