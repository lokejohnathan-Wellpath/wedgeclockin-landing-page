"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { loadManagedClients, loadMonthlyAccountFile } from "./service";
import type { ManagedClient, MonthlyAccountFile } from "./types";

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value);
}

function monthLabel(month: number, year: number) {
  return new Intl.DateTimeFormat("en-MY", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function statusTone(status: string) {
  if (["complete", "reconciled", "closed", "ready"].includes(status)) return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  if (["review_required", "exceptions", "processing", "matching"].includes(status)) return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  if (["waiting_client", "statement_missing"].includes(status)) return "border-red-400/20 bg-red-400/10 text-red-200";
  return "border-white/10 bg-white/[0.04] text-white/55";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ManagedAccountsControlPage() {
  const now = new Date();
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [monthlyFiles, setMonthlyFiles] = useState<Record<string, MonthlyAccountFile>>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await loadManagedClients();
      const nextClients = Array.isArray(result.clients) ? result.clients : [];
      setClients(nextClients);

      const monthResults = await Promise.allSettled(
        nextClients.map(async (client) => {
          const response = await loadMonthlyAccountFile(client.businessId, now.getFullYear(), now.getMonth() + 1);
          return [client.businessId, response.file] as const;
        }),
      );

      const nextFiles: Record<string, MonthlyAccountFile> = {};
      for (const item of monthResults) {
        if (item.status === "fulfilled") nextFiles[item.value[0]] = item.value[1];
      }
      setMonthlyFiles(nextFiles);
    } catch (err) {
      setClients([]);
      setMonthlyFiles({});
      setError(err instanceof Error ? err.message : "Managed clients could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) =>
      [client.legalName, client.tradingName || "", client.companyCode, client.businessId, client.industry]
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [clients, search]);

  const files = Object.values(monthlyFiles);
  const reconciled = files.filter((file) => ["reconciled", "closed"].includes(file.bankReconciliation)).length;
  const awaitingClient = files.filter((file) => file.missingDocumentCount > 0 || file.sales === "waiting_client" || file.documents === "waiting_client").length;
  const reviewRequired = files.filter((file) => file.review === "review_required" || file.pnl === "review_required").length;

  return (
    <main className="min-h-screen bg-[#090d10] text-[#f4efe6]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(183,145,80,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(72,89,91,0.13),transparent_30%)]" />

      <div className="relative mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/wedge-i" className="text-sm font-medium text-[#c8a467] hover:text-[#ead3a8]">← Wedge-I Hub</Link>
            <p className="mt-5 text-xs font-semibold tracking-[0.28em] text-[#c8a467]">WEDGE-I · MANAGED ACCOUNTS</p>
            <h1 className="mt-3 text-4xl font-semibold text-[#f1dfbc]">Business &amp; Accounts Hub</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
              Wedge-I is the master starting point. Register each business once, then WedgeBooks and WedgeCLOCKin are provisioned under the same permanent business identity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/wedge-i/accounts/pnl-templates" className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-semibold text-white/60">Industry P&amp;L Library</Link>
            <Link href="/wedge-i/accounts/new" className="rounded-full bg-[#c8a467] px-5 py-2.5 text-xs font-bold text-[#111416]">+ Register Business in Wedge-I</Link>
          </div>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Managed businesses" value={loading ? "…" : String(clients.length)} detail="Loaded from Wedge-I client master" />
          <Metric label="Awaiting client" value={loading ? "…" : String(awaitingClient)} detail="Missing sales / documents" />
          <Metric label="Review required" value={loading ? "…" : String(reviewRequired)} detail="Accountant / reviewer action" />
          <Metric label="Bank reconciled" value={loading ? "…" : `${reconciled}/${files.length}`} detail="Current monthly files" />
        </section>

        {error ? (
          <section className="mt-7 rounded-[24px] border border-amber-300/20 bg-amber-300/5 p-6">
            <p className="text-sm font-semibold text-amber-100">Wedge-I client master is not available yet.</p>
            <p className="mt-2 text-xs leading-5 text-white/45">{error}</p>
            <p className="mt-3 text-xs leading-5 text-white/35">No demo companies are shown. Once the managed-accounts backend is connected, this page will display only real registered businesses.</p>
            <button onClick={load} className="mt-4 rounded-full border border-amber-200/20 px-4 py-2 text-xs font-semibold text-amber-100">Retry</button>
          </section>
        ) : null}

        {!loading && !error && clients.length === 0 ? (
          <section className="mt-8 rounded-[30px] border border-dashed border-[#c8a467]/25 bg-[#11171b]/70 px-6 py-14 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#c8a467]/30 bg-[#c8a467]/10 text-xl font-bold text-[#d9b979]">W</div>
            <h2 className="mt-5 text-2xl font-semibold text-[#f1dfbc]">No managed businesses registered yet</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/40">Start in Wedge-I. The registration creates the permanent business identity and requests WedgeBooks + WedgeCLOCKin activation together.</p>
            <Link href="/wedge-i/accounts/new" className="mt-6 inline-flex rounded-full bg-[#c8a467] px-6 py-3 text-sm font-bold text-[#111416]">Register First Business</Link>
          </section>
        ) : null}

        {clients.length > 0 ? (
          <section className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-[#11171b]/95">
            <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">WEDGE-I CLIENT MASTER</p>
                <h2 className="mt-2 text-xl font-semibold text-[#f1dfbc]">Registered businesses</h2>
              </div>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search business, code or industry" className="w-full rounded-xl border border-white/10 bg-[#090d10] px-4 py-3 text-sm text-white outline-none focus:border-[#c8a467] sm:w-80" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="border-b border-white/8 text-[11px] uppercase tracking-[0.12em] text-white/35">
                  <tr>
                    <th className="px-6 py-4">Business</th>
                    <th className="px-4 py-4">Tools</th>
                    <th className="px-4 py-4">Month</th>
                    <th className="px-4 py-4">Books</th>
                    <th className="px-4 py-4">Payroll</th>
                    <th className="px-4 py-4">Bank</th>
                    <th className="px-4 py-4">P&amp;L</th>
                    <th className="px-4 py-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const file = monthlyFiles[client.businessId];
                    return (
                      <tr key={client.businessId} className="border-b border-white/[0.06] last:border-0">
                        <td className="px-6 py-5">
                          <div className="font-semibold text-white/90">{client.tradingName || client.legalName}</div>
                          <div className="mt-1 text-xs text-white/35">{client.businessId} · {client.companyCode}</div>
                          <div className="mt-1 text-xs text-[#c8a467]/75">{client.industry}</div>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex flex-wrap gap-1.5">
                            <ToolBadge enabled={client.wedgeBooksEnabled} label="Books" />
                            <ToolBadge enabled={client.wedgeClockInEnabled} label="CLOCKin" />
                          </div>
                        </td>
                        <td className="px-4 py-5 text-white/55">{file ? monthLabel(file.month, file.year) : "Not started"}</td>
                        <StatusCell value={file?.books || "not_started"} />
                        <StatusCell value={file?.payroll || "not_started"} />
                        <StatusCell value={file?.bankReconciliation || "not_started"} />
                        <StatusCell value={file?.pnl || "not_started"} />
                        <td className="px-4 py-5">
                          <div className="flex flex-col items-start gap-2">
                            <Link href={`/wedge-i/accounts/pnl?businessId=${encodeURIComponent(client.businessId)}`} className="text-xs font-semibold text-[#c8a467]">Open P&amp;L</Link>
                            <Link href={`/wedge-i/accounts/reconciliation?businessId=${encodeURIComponent(client.businessId)}`} className="text-xs text-white/45 hover:text-white">Reconcile</Link>
                            {file?.reconciliationDifference ? <span className="text-[10px] text-red-200">Diff {money(file.reconciliationDifference)}</span> : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#11171b]/90 p-5"><p className="text-xs uppercase tracking-[0.14em] text-white/35">{label}</p><div className="mt-3 text-3xl font-semibold text-[#f1dfbc]">{value}</div><p className="mt-2 text-xs text-white/35">{detail}</p></div>;
}

function StatusCell({ value }: { value: string }) {
  return <td className="px-4 py-5"><span className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold ${statusTone(value)}`}>{statusLabel(value)}</span></td>;
}

function ToolBadge({ enabled, label }: { enabled: boolean; label: string }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${enabled ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-white/10 bg-white/[.03] text-white/30"}`}>{label} {enabled ? "ON" : "OFF"}</span>;
}
