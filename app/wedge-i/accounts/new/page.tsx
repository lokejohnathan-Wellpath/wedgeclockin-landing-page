"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { createManagedClient } from "../service";
import { MANAGED_ACCOUNT_INDUSTRIES, type ManagedAccountIndustry } from "../types";

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#0e1418] px-4 py-3 text-sm text-white outline-none focus:border-[#c8a467]";

export default function NewManagedClientPage() {
  const [businessId, setBusinessId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("businessId") || "";
    if (id) setBusinessId(id);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await createManagedClient({
        existingWedgeIBusinessId: businessId.trim(),
        industry: String(form.get("industry")) as ManagedAccountIndustry,
        financialYearEnd: String(form.get("financialYearEnd") || "12-31"),
        sstRegistered: form.get("sstRegistered") === "on",
        sstRegistrationNumber: String(form.get("sstRegistrationNumber") || "").trim() || undefined,
        serviceChargeEnabled: form.get("serviceChargeEnabled") === "on",
        assignedAccountsExecutive: String(form.get("assignedAccountsExecutive") || "").trim() || undefined,
        subscriptionStatus: "pilot",
        subscriptionStartedAt: new Date().toISOString(),
        bankName: String(form.get("bankName") || "").trim() || undefined,
        bankLast4: String(form.get("bankLast4") || "").trim() || undefined,
      });
      setMessage(`${result.client.legalName} is connected to Managed Accounts under ${result.client.businessId}. WedgeBooks and WedgeCLOCKin are included under the same owner identity.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Managed Accounts could not be activated.");
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[#090d10] px-5 py-8 text-[#f4efe6] sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/founder-john-control/businesses" className="text-sm font-medium text-[#c8a467]">← Approved Businesses</Link>
          <Link href="/wedge-i/accounts" className="text-sm font-medium text-white/45">Accounts Control</Link>
        </div>

        <div className="mt-6 rounded-[30px] border border-white/10 bg-[#11171b]/95 p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.22em] text-[#c8a467]">FOUNDER MANAGED-ACCOUNT ACTIVATION</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#f1dfbc]">Configure Managed Accounts</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">Managed Accounts can only attach to an already approved Wedge business. No duplicate company is created here.</p>

          <form onSubmit={submit} className="mt-8 space-y-8">
            <Section title="Canonical Wedge business">
              <div className="rounded-2xl border border-[#c8a467]/20 bg-[#c8a467]/5 p-5">
                <label className="text-sm font-semibold text-white/70">Business ID
                  <input value={businessId} onChange={(event) => setBusinessId(event.target.value)} name="existingWedgeIBusinessId" required placeholder="WDG-..." className={inputClass} />
                  <span className="mt-2 block text-xs font-normal leading-5 text-white/35">Use the permanent ID from Approved Businesses. The owner, company code and legal identity are reused automatically.</span>
                </label>
              </div>
            </Section>

            <Section title="Accounting profile">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-white/70">Industry
                  <select name="industry" required className={inputClass} defaultValue="F&B - Restaurant / Cafe / QSR">
                    {MANAGED_ACCOUNT_INDUSTRIES.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <Field name="financialYearEnd" label="Financial year end" defaultValue="12-31" />
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/65"><input name="sstRegistered" type="checkbox" className="accent-[#c8a467]" /> SST registered</label>
                <Field name="sstRegistrationNumber" label="SST registration no." placeholder="Optional" required={false} />
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/65 md:col-span-2"><input name="serviceChargeEnabled" type="checkbox" className="accent-[#c8a467]" /> Restaurant / cafe uses service charge</label>
                <Field name="assignedAccountsExecutive" label="Assigned accounts executive" placeholder="Optional" required={false} />
              </div>
            </Section>

            <Section title="Primary bank reference">
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="bankName" label="Bank" placeholder="Maybank" required={false} />
                <Field name="bankLast4" label="Last 4 digits only" placeholder="4421" maxLength={4} required={false} />
              </div>
              <p className="mt-3 text-xs leading-5 text-white/35">Never collect internet-banking usernames, passwords, PINs or TACs. Reconciliation uses statements / transaction exports.</p>
            </Section>

            <div className="rounded-2xl border border-[#c8a467]/20 bg-[#c8a467]/5 p-5 text-sm leading-6 text-white/55"><b className="text-[#e3c78e]">Activation result:</b> same Business ID · Managed Accounts active/pilot · WedgeBooks included · WedgeCLOCKin included · industry P&amp;L profile attached · owner continues using the single Client Login.</div>

            {error ? <div className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
            {message ? <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}<div className="mt-3"><Link href={`/wedge-i/accounts/pnl?businessId=${encodeURIComponent(businessId)}`} className="font-bold underline">Open P&amp;L Workspace</Link></div></div> : null}

            <button disabled={busy || !businessId.trim()} className="w-full rounded-xl bg-[#c8a467] px-6 py-4 text-sm font-bold tracking-[0.08em] text-[#111416] disabled:opacity-60">{busy ? "CONNECTING MANAGED ACCOUNTS..." : "ACTIVATE / UPDATE MANAGED ACCOUNTS"}</button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#c8a467]">{title}</h2>{children}</section>;
}

function Field({ label, required = true, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; required?: boolean }) {
  return <label className="text-sm font-semibold text-white/70">{label}<input {...props} required={required} className={inputClass} /></label>;
}
