"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FOUNDER_TOKEN_KEY, founderRequest } from "../../lib/founderApi";

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#0d1316] px-4 py-3 text-sm text-white outline-none focus:border-[#d2aa62]";

type RecoveryResult = {
  success: true;
  recovered: boolean;
  businessId: string;
  companyCode: string;
  ownerEmail?: string;
  message: string;
};

export default function RecoverManagedBusinessPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RecoveryResult | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(FOUNDER_TOKEN_KEY)) {
      router.replace("/founder-john-control");
    }
  }, [router]);

  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    const form = new FormData(event.currentTarget);
    try {
      const response = await founderRequest<RecoveryResult>("/api/founder/control/business-recovery", {
        method: "POST",
        body: JSON.stringify({
          companyCode: form.get("companyCode"),
          ownerEmail: form.get("ownerEmail"),
          reason: form.get("reason") || "Founder recovery of managed client access",
        }),
      });
      setResult(response);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Business recovery failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080c0f] px-5 py-10 text-[#f3efe7] sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/founder-john-control/businesses" className="text-sm font-semibold text-[#d2aa62]">← Managed Businesses</Link>
        <p className="mt-8 text-xs font-bold tracking-[.22em] text-[#d2aa62]">FOUNDER RECOVERY</p>
        <h1 className="mt-2 font-serif text-4xl">Recover managed business</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">Use this only when a client disappeared from the live managed-business and CLOCKin records. Recovery uses retained Founder audit history and restores the linked business identity; it does not guess or expose passwords.</p>

        <form onSubmit={recover} className="mt-8 rounded-[28px] border border-[#d2aa62]/20 bg-[#11181c] p-6 sm:p-8">
          <label className="block text-sm font-semibold text-white/70">Company Code
            <input name="companyCode" required placeholder="WEDGETESFA88" className={inputClass} />
          </label>
          <label className="mt-5 block text-sm font-semibold text-white/70">Owner email
            <input name="ownerEmail" required type="email" placeholder="owner@company.com" className={inputClass} />
          </label>
          <label className="mt-5 block text-sm font-semibold text-white/70">Recovery reason
            <input name="reason" defaultValue="Recover managed client access from Founder audit history" className={inputClass} />
          </label>
          <button disabled={busy} className="mt-6 w-full rounded-full bg-[#d2aa62] px-6 py-4 font-bold text-black disabled:opacity-60">
            {busy ? "Recovering…" : "Recover Business"}
          </button>
        </form>

        {error ? <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div> : null}

        {result ? (
          <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-sm text-emerald-100">
            <p className="font-bold">{result.recovered ? "Business recovered." : "Business already active."}</p>
            <p className="mt-2">{result.message}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-black/20 px-3 py-1">{result.companyCode}</span>
              <span className="rounded-full bg-black/20 px-3 py-1">{result.businessId}</span>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/manager-forgot-password" className="rounded-full bg-[#d2aa62] px-5 py-3 font-bold text-black">Reset Operations Password</Link>
              <Link href="/founder-john-control/businesses" className="rounded-full border border-white/15 px-5 py-3 font-bold text-white">Back to Managed Businesses</Link>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
