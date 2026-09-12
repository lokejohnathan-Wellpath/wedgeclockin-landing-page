"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
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
  assignedAccountsExecutive?: string;
  managedProfileConfigured: boolean;
  industry?: string;
  entitlements: {
    wedgeI: Entitlement;
    managedAccounts: Entitlement;
    books: Entitlement;
    clockIn: Entitlement;
  };
  updatedAt: string;
};

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#0d1316] px-4 py-3 text-sm text-white outline-none focus:border-[#d2aa62]";

export default function FounderBusinessesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Business[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await founderRequest<{ success: true; businesses: Business[] }>("/api/founder/control/businesses");
      setRows(result.businesses || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Managed businesses could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(FOUNDER_TOKEN_KEY)) {
      router.replace("/founder-john-control");
      return;
    }
    void load();
  }, [load, router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => [row.legalName, row.tradingName || "", row.companyCode, row.businessId, row.ownerName, row.ownerEmail].some((value) => value.toLowerCase().includes(q)));
  }, [rows, search]);

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const payload = Object.fromEntries(form.entries());
      const result = await founderRequest<{ success: true; business: Business; message: string }>("/api/founder/control/businesses", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          employeeLimit: Number(payload.employeeLimit || 12),
          sstRegistered: form.get("sstRegistered") === "on",
          serviceChargeEnabled: form.get("serviceChargeEnabled") === "on",
        }),
      });
      setRows((current) => [result.business, ...current]);
      setShowCreate(false);
      setMessage(`${result.business.tradingName || result.business.legalName} created under ${result.business.businessId}. The client uses WedgeCLOCKin + document capture; Wedge-I and Books stay internal.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Business could not be created.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteBusiness(row: Business) {
    const confirmation = window.prompt(`Type DELETE to remove ${row.tradingName || row.legalName} from active Wedge operations.`);
    if (confirmation !== "DELETE") return;
    const reason = window.prompt("Reason for deleting this business? Accounting history will be retained for audit purposes.");
    if (!reason?.trim()) return;
    setDeletingId(row.businessId);
    setError("");
    setMessage("");
    try {
      await founderRequest<{ success: true; message: string }>(`/api/founder/control/businesses/${encodeURIComponent(row.businessId)}`, {
        method: "DELETE",
        body: JSON.stringify({ reason: reason.trim() }),
      });
      setRows((current) => current.filter((item) => item.businessId !== row.businessId));
      setMessage(`${row.tradingName || row.legalName} removed from active operations. CLOCKin and internal product access are disabled; historical accounting records remain retained.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Business could not be deleted.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#080c0f] px-5 py-8 text-[#f3efe7] sm:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/founder-john-control/dashboard" className="text-sm font-semibold text-[#d2aa62]">← Founder Dashboard</Link>
            <p className="mt-6 text-xs font-bold tracking-[.22em] text-[#d2aa62]">MANAGED BUSINESS REGISTRY</p>
            <h1 className="mt-2 font-serif text-4xl">Wedge managed businesses</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">One permanent Business ID per client. Create the client here once, then do all bookkeeping, reconciliation, payroll review and P&amp;L work inside that business context.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowCreate((value) => !value)} className="rounded-xl bg-[#d2aa62] px-5 py-3 text-sm font-bold text-black">{showCreate ? "Close Form" : "+ Add Business"}</button>
            <button onClick={() => void load()} disabled={loading} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold">Refresh</button>
          </div>
        </div>

        {showCreate ? (
          <form onSubmit={createBusiness} className="mt-7 rounded-[28px] border border-[#d2aa62]/20 bg-[#11181c] p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-[.18em] text-[#d2aa62]">FOUNDER ONBOARDING</p><h2 className="mt-2 text-2xl font-semibold text-[#f1dfbc]">Create managed business</h2><p className="mt-2 text-sm text-white/40">This provisions the permanent Wedge identity, internal WedgeBooks and the client&apos;s WedgeCLOCKin access in one step.</p></div></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Field name="legalName" label="Legal business name" placeholder="ABC Restaurant Sdn Bhd" />
              <Field name="tradingName" label="Trading name" placeholder="ABC Restaurant" required={false} />
              <Field name="companyCode" label="CLOCKin company code" placeholder="ABCREST" />
              <Field name="registrationNumber" label="SSM / registration no." placeholder="Optional" required={false} />
              <label className="text-sm font-semibold text-white/65">Business type<select name="businessType" defaultValue="F&B" className={inputClass}><option>F&B</option><option>Retail</option><option>Service</option><option>Manufacturing</option><option>Construction</option><option>General SME</option></select></label>
              <Field name="industry" label="P&L industry profile" placeholder="F&B - Restaurant / Cafe / QSR" />
              <Field name="ownerName" label="Business owner / contact" placeholder="Owner name" />
              <Field name="ownerEmail" label="Owner email" type="email" placeholder="owner@company.com" />
              <Field name="phone" label="Owner phone" placeholder="01X-XXXXXXX" />
              <Field name="address" label="Business address" placeholder="Business address" required={false} />
              <Field name="managerPassword" label="Initial CLOCKin password" type="password" minLength={8} placeholder="Minimum 8 characters" />
              <Field name="employeeLimit" label="Staff limit" type="number" min={1} defaultValue="12" />
              <Field name="assignedAccountsExecutive" label="Assigned Wedge accounts executive" placeholder="Optional" required={false} />
              <Field name="financialYearEnd" label="Financial year end" defaultValue="12-31" />
              <Field name="sstRegistrationNumber" label="SST registration no." placeholder="Optional" required={false} />
            </div>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/55"><label className="flex items-center gap-2"><input name="sstRegistered" type="checkbox" className="accent-[#d2aa62]" /> SST registered</label><label className="flex items-center gap-2"><input name="serviceChargeEnabled" type="checkbox" className="accent-[#d2aa62]" /> Service charge enabled</label></div>
            <button disabled={creating} className="mt-6 rounded-xl bg-[#d2aa62] px-6 py-3.5 text-sm font-bold text-black disabled:opacity-50">{creating ? "Creating business…" : "Create Managed Business"}</button>
          </form>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search business, company code, Business ID or owner" className="w-full max-w-xl rounded-xl border border-white/10 bg-[#101619] px-4 py-3 text-sm text-white outline-none focus:border-[#d2aa62]" />
          <span className="text-xs text-white/35">{rows.length} active managed business(es)</span>
        </div>
        {error ? <p className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</p> : null}
        {message ? <p className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{message}</p> : null}

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-[#121a1e]">
          {loading ? <p className="p-6 text-sm text-white/45">Loading managed businesses…</p> : !filtered.length ? <p className="p-8 text-center text-sm text-white/45">No managed businesses match this search.</p> : (
            <div className="divide-y divide-white/[.06]">
              {filtered.map((row) => (
                <article key={row.businessId} className="grid gap-5 p-5 lg:grid-cols-[1.5fr_1fr_1fr_auto] lg:items-center">
                  <div>
                    <h2 className="font-bold text-[#f1dfbc]">{row.tradingName || row.legalName}</h2>
                    <p className="mt-1 text-xs text-white/40">{row.legalName}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px]"><Code>{row.companyCode}</Code><Code>{row.businessId}</Code><Code>{row.industry || row.businessType}</Code></div>
                  </div>
                  <div className="text-sm"><p>{row.ownerName}</p><p className="mt-1 text-xs text-[#a8cfc9]">{row.ownerEmail}</p><p className="mt-1 text-xs text-white/35">Client tools: CLOCKin + document capture</p></div>
                  <div className="flex flex-wrap gap-2 text-[11px]"><Pill active>Wedge-I internal</Pill><Pill active={row.entitlements.books.enabled}>Books internal</Pill><Pill active={row.entitlements.clockIn.enabled}>CLOCKin client</Pill></div>
                  <div className="flex flex-col gap-2 lg:min-w-48">
                    <Link href={`/wedge-i?businessId=${encodeURIComponent(row.businessId)}`} className="rounded-lg bg-[#d2aa62] px-4 py-2.5 text-center text-xs font-bold text-black">Open Business Workspace</Link>
                    <Link href={`/wedge-i/books?businessId=${encodeURIComponent(row.businessId)}`} className="rounded-lg border border-white/10 px-4 py-2 text-center text-xs font-bold text-white/60">Open Books</Link>
                    <button disabled={deletingId === row.businessId} onClick={() => void deleteBusiness(row)} className="rounded-lg border border-red-400/25 bg-red-400/5 px-4 py-2 text-xs font-bold text-red-200 disabled:opacity-50">{deletingId === row.businessId ? "Deleting…" : "Delete Business"}</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Field({ label, required = true, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return <label className="text-sm font-semibold text-white/65">{label}<input {...props} required={required} name={props.name} className={inputClass} /></label>;
}
function Code({ children }: { children: React.ReactNode }) { return <span className="rounded-full border border-white/10 bg-white/[.035] px-3 py-1 text-white/55">{children}</span>; }
function Pill({ active, children }: { active: boolean; children: React.ReactNode }) { return <span className={`rounded-full px-3 py-1 font-bold ${active ? "bg-emerald-400/10 text-emerald-200" : "bg-white/[.04] text-white/30"}`}>{children}</span>; }
