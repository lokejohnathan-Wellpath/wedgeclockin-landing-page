"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { createManagedClient } from "../service";
import { MANAGED_ACCOUNT_INDUSTRIES, type ManagedAccountIndustry } from "../types";

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#0e1418] px-4 py-3 text-sm text-white outline-none focus:border-[#c8a467]";

export default function NewManagedClientPage() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    const form = new FormData(event.currentTarget);

    try {
      const result = await createManagedClient({
        companyCode: String(form.get("companyCode") || "").trim().toUpperCase(),
        legalName: String(form.get("legalName") || "").trim(),
        tradingName: String(form.get("tradingName") || "").trim() || undefined,
        registrationNumber: String(form.get("registrationNumber") || "").trim(),
        industry: String(form.get("industry")) as ManagedAccountIndustry,
        financialYearEnd: String(form.get("financialYearEnd") || "12-31"),
        sstRegistered: form.get("sstRegistered") === "on",
        sstRegistrationNumber: String(form.get("sstRegistrationNumber") || "").trim() || undefined,
        serviceChargeEnabled: form.get("serviceChargeEnabled") === "on",
        ownerName: String(form.get("ownerName") || "").trim(),
        ownerEmail: String(form.get("ownerEmail") || "").trim(),
        ownerPhone: String(form.get("ownerPhone") || "").trim() || undefined,
        assignedAccountsExecutive: String(form.get("assignedAccountsExecutive") || "").trim() || undefined,
        subscriptionStatus: "pilot",
        subscriptionStartedAt: new Date().toISOString(),
        wedgeBooksEnabled: true,
        wedgeClockInEnabled: true,
        bankName: String(form.get("bankName") || "").trim() || undefined,
        bankLast4: String(form.get("bankLast4") || "").trim() || undefined,
      });

      setMessage(`${result.client.legalName} created as ${result.client.businessId}. WedgeBooks and WedgeCLOCKin are enabled.`);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Client could not be created.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090d10] px-5 py-8 text-[#f4efe6] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link href="/wedge-i/accounts" className="text-sm font-medium text-[#c8a467] hover:text-[#ead3a8]">← Accounts Control Centre</Link>

        <div className="mt-6 rounded-[30px] border border-white/10 bg-[#11171b]/95 p-6 sm:p-8">
          <p className="text-xs font-semibold tracking-[0.22em] text-[#c8a467]">MASTER CLIENT REGISTRATION</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#f1dfbc]">Add managed accounts client</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
            Register the company once in Wedge-I. The backend will create the permanent business ID, keep the easy company code, and provision WedgeBooks plus WedgeCLOCKin for the managed-account subscription.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-8">
            <Section title="Company identity">
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="legalName" label="Legal company name" placeholder="ABC Cafe Sdn Bhd" />
                <Field name="tradingName" label="Trading name" placeholder="ABC Cafe" required={false} />
                <Field name="registrationNumber" label="SSM registration no." placeholder="202601234567" />
                <Field name="companyCode" label="Easy company login code" placeholder="ABCCAFE" help="Short, memorable and unique. Employees will use this with their Staff ID + PIN." />
              </div>
            </Section>

            <Section title="Accounting profile">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-white/70">Industry
                  <select name="industry" required className={inputClass} defaultValue="F&B - Restaurant / Cafe / QSR">
                    {MANAGED_ACCOUNT_INDUSTRIES.map((industry) => <option key={industry} value={industry}>{industry}</option>)}
                  </select>
                </label>
                <Field name="financialYearEnd" label="Financial year end" placeholder="12-31" defaultValue="12-31" />
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/65"><input name="sstRegistered" type="checkbox" className="accent-[#c8a467]" /> SST registered</label>
                <Field name="sstRegistrationNumber" label="SST registration no." placeholder="Optional" required={false} />
                <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/65 md:col-span-2"><input name="serviceChargeEnabled" type="checkbox" className="accent-[#c8a467]" /> Restaurant / cafe uses service charge</label>
              </div>
            </Section>

            <Section title="Client owner / accounting contact">
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="ownerName" label="Owner / authorised person" placeholder="Full name" />
                <Field name="ownerEmail" label="Owner email" type="email" placeholder="owner@company.com" />
                <Field name="ownerPhone" label="Owner mobile" type="tel" placeholder="+60..." required={false} />
                <Field name="assignedAccountsExecutive" label="Assigned accounts executive" placeholder="Accounts Executive A" required={false} />
              </div>
            </Section>

            <Section title="Primary bank account">
              <div className="grid gap-4 md:grid-cols-2">
                <Field name="bankName" label="Bank" placeholder="Maybank" required={false} />
                <Field name="bankLast4" label="Last 4 digits only" placeholder="4421" maxLength={4} required={false} />
              </div>
              <p className="mt-3 text-xs leading-5 text-white/35">Do not collect internet-banking usernames, passwords, PINs or TACs. Initial reconciliation uses uploaded bank statements / exports.</p>
            </Section>

            <div className="rounded-2xl border border-[#c8a467]/20 bg-[#c8a467]/5 p-5 text-sm text-white/55">
              <b className="text-[#e3c78e]">Provision on activation:</b> WedgeBooks included · WedgeCLOCKin included · owner/client access enabled · employee IDs remain separate under the same company code.
            </div>

            {error ? <div className="rounded-xl border border-red-400/25 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
            {message ? <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}

            <button disabled={busy} className="w-full rounded-xl bg-[#c8a467] px-6 py-4 text-sm font-bold tracking-[0.08em] text-[#111416] disabled:opacity-60">
              {busy ? "CREATING CLIENT..." : "CREATE CLIENT & ENABLE TOOLS"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-[#c8a467]">{title}</h2>{children}</section>;
}

function Field({ label, help, required = true, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; help?: string; required?: boolean }) {
  return <label className="text-sm font-semibold text-white/70">{label}<input {...props} required={required} className={inputClass} />{help ? <span className="mt-2 block text-xs font-normal leading-5 text-white/35">{help}</span> : null}</label>;
}
