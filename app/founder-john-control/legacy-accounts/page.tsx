"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FOUNDER_TOKEN_KEY, founderRequest } from "../../lib/founderApi";

type Account = {
  accountType: "company" | "smartpos" | "saas";
  accountId: string;
  product: "clockin" | "books" | "smartpos" | "erp";
  businessName: string;
  ownerName: string;
  email: string;
  telephone: string;
  subscription: { status: string };
};

type Dashboard = { accounts: Account[] };
const productName: Record<Account["product"], string> = { clockin: "Wedge Clock-In", books: "WedgeBooks", smartpos: "Wedge SmartPOS", erp: "Wedge ERP/Supply" };

export default function LegacyAccountsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Account[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await founderRequest<Dashboard>("/api/founder/control/dashboard");
      setRows(result.accounts || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Accounts could not be loaded.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(FOUNDER_TOKEN_KEY)) { router.replace("/founder-john-control"); return; }
    void load();
  }, [load, router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.businessName, row.ownerName, row.email, row.telephone, row.product].some((value) => String(value || "").toLowerCase().includes(q)));
  }, [rows, search]);

  async function remove(row: Account) {
    const confirmText = window.prompt(`Type DELETE to remove ${row.businessName} from the Founder product-account dashboard.`);
    if (confirmText !== "DELETE") return;
    const reason = window.prompt("Reason for deletion?", "Testing account cleanup");
    if (!reason?.trim()) return;
    const key = `${row.accountType}:${row.accountId}`;
    setDeleting(key); setError(""); setMessage("");
    try {
      const result = await founderRequest<{ success: true; message?: string }>(`/api/founder/control/accounts/${encodeURIComponent(row.accountType)}/${encodeURIComponent(row.accountId)}`, { method: "DELETE", body: JSON.stringify({ reason: reason.trim() }) });
      setRows((current) => current.filter((item) => !(item.accountType === row.accountType && item.accountId === row.accountId)));
      setMessage(result.message || `${row.businessName} removed.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Account could not be deleted.");
    } finally { setDeleting(""); }
  }

  return <main className="min-h-screen bg-[#080c0f] px-5 py-8 text-[#f3efe7] sm:px-8"><div className="mx-auto max-w-[1500px]"><div className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/founder-john-control/dashboard" className="text-sm font-semibold text-[#d2aa62]">← Founder Dashboard</Link><p className="mt-6 text-xs font-bold tracking-[.22em] text-[#d2aa62]">LEGACY PRODUCT ACCOUNTS</p><h1 className="mt-2 font-serif text-4xl">Delete test accounts</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">These are the old Clock-In, SmartPOS, Books and ERP accounts shown in the Founder Dashboard. Deleting one removes it from the dashboard and disables its access while retaining historical records for audit safety.</p></div><button onClick={() => void load()} disabled={loading} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold">Refresh</button></div><div className="mt-7 flex flex-wrap items-center gap-3"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, owner, email or product" className="w-full max-w-xl rounded-xl border border-white/10 bg-[#101619] px-4 py-3 text-sm text-white outline-none focus:border-[#d2aa62]"/><span className="text-xs text-white/35">{rows.length} account(s)</span></div>{error ? <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p> : null}{message ? <p className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{message}</p> : null}<section className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-[#121a1e]">{loading ? <p className="p-6 text-sm text-white/45">Loading product accounts…</p> : !filtered.length ? <p className="p-8 text-center text-sm text-white/45">No accounts match this search.</p> : <div className="divide-y divide-white/[.06]">{filtered.map((row) => { const key = `${row.accountType}:${row.accountId}`; return <article key={key} className="grid gap-4 p-5 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center"><div><h2 className="font-bold text-[#f1dfbc]">{row.businessName}</h2><p className="mt-1 text-xs text-white/35">{row.telephone || "No telephone"}</p></div><div className="text-sm"><p>{productName[row.product]}</p><p className="mt-1 text-xs text-white/35">{row.subscription.status.replaceAll("_", " ")}</p></div><div className="text-sm"><p>{row.ownerName}</p><p className="mt-1 text-xs text-[#a8cfc9]">{row.email}</p></div><button disabled={deleting === key} onClick={() => void remove(row)} className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-xs font-bold text-red-200 disabled:opacity-50">{deleting === key ? "Deleting…" : "Delete Account"}</button></article>; })}</div>}</section></div></main>;
}
