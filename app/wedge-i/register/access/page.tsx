"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const inputClass = "mt-2 w-full rounded-xl border border-[#20282c]/15 bg-white px-4 py-3 outline-none focus:border-[#b4873b]";

function apiBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Wedge access service is not configured.");
  return base;
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Request failed.");
  return data as T;
}

export default function ApprovedBusinessAccessPage() {
  const params = useSearchParams();
  const requestId = params.get("request") || "";
  const [step, setStep] = useState<"start" | "verify" | "complete" | "done">("start");
  const [challengeId, setChallengeId] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ businessId: string; companyCode: string; entitlements: Record<string, { enabled: boolean }> } | null>(null);

  useEffect(() => {
    if (!requestId) setError("Registration request is missing. Return to Business Profile first.");
  }, [requestId]);

  async function start() {
    if (!requestId) return;
    setBusy(true); setError("");
    try {
      const data = await request<{ challengeId: string }>(`/api/business-registrations/${encodeURIComponent(requestId)}/access/start`, { method: "POST" });
      setChallengeId(data.challengeId);
      setStep("verify");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Access setup could not start."); }
    finally { setBusy(false); }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const data = await request<{ verificationToken: string }>(`/api/business-registrations/${encodeURIComponent(requestId)}/access/verify`, {
        method: "POST",
        body: JSON.stringify({ challengeId, code: form.get("code") }),
      });
      setVerificationToken(data.verificationToken);
      setStep("complete");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Verification failed."); }
    finally { setBusy(false); }
  }

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirmPassword")) {
      setError("Passwords do not match."); setBusy(false); return;
    }
    try {
      const data = await request<{ business: { businessId: string; companyCode: string; entitlements: Record<string, { enabled: boolean }> } }>(`/api/business-registrations/${encodeURIComponent(requestId)}/access/complete`, {
        method: "POST",
        body: JSON.stringify({
          challengeId,
          verificationToken,
          address: form.get("address"),
          password: form.get("password"),
        }),
      });
      setResult(data.business);
      setStep("done");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Access setup could not be completed."); }
    finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-5 py-10 text-[#20282c]">
      <div className="mx-auto max-w-xl">
        <Link href="/wedge-i/register" className="text-sm font-semibold text-[#8b692f]">← Business Profile</Link>
        <section className="mt-6 rounded-[30px] border border-[#20282c]/10 bg-[#fffdf8] p-7 shadow-[0_24px_70px_rgba(32,40,44,.10)] sm:p-9">
          <p className="text-xs font-bold tracking-[.22em] text-[#b4873b]">APPROVED BUSINESS ACCESS</p>
          <h1 className="mt-3 text-3xl font-semibold">Set up owner access once.</h1>
          <p className="mt-4 text-sm leading-6 text-[#657074]">Verify the Founder-approved owner email, add the business address, then choose one password. Wedge will provision only the products Founder enabled.</p>

          {step === "start" ? <button disabled={busy || !requestId} onClick={() => void start()} className="mt-7 w-full rounded-xl bg-[#20282c] px-5 py-4 font-bold text-white disabled:opacity-50">{busy ? "Sending code…" : "Send verification code"}</button> : null}

          {step === "verify" ? <form onSubmit={verify} className="mt-7 space-y-4"><label className="block text-sm font-semibold">Verification code<input name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} className={inputClass}/></label><button disabled={busy} className="w-full rounded-xl bg-[#20282c] px-5 py-4 font-bold text-white">{busy ? "Verifying…" : "Verify owner email"}</button></form> : null}

          {step === "complete" ? <form onSubmit={complete} className="mt-7 space-y-4"><label className="block text-sm font-semibold">Business address<textarea name="address" required rows={3} className={inputClass}/></label><label className="block text-sm font-semibold">Create owner password<input name="password" required type="password" minLength={8} autoComplete="new-password" className={inputClass}/></label><label className="block text-sm font-semibold">Confirm password<input name="confirmPassword" required type="password" minLength={8} autoComplete="new-password" className={inputClass}/></label><button disabled={busy} className="w-full rounded-xl bg-[#20282c] px-5 py-4 font-bold text-white">{busy ? "Activating…" : "Activate approved access"}</button></form> : null}

          {step === "done" && result ? <div className="mt-7 space-y-4"><div className="rounded-2xl border border-emerald-700/15 bg-emerald-50 p-5 text-sm text-emerald-900"><b>Owner access is ready.</b><div className="mt-2">Business ID: <b>{result.businessId}</b></div><div>Company code: <b>{result.companyCode}</b></div></div><div className="grid gap-3 sm:grid-cols-2">{result.entitlements?.books?.enabled ? <Link href="/wedge-i/books/login" className="rounded-xl bg-[#20282c] px-5 py-4 text-center font-bold text-white">Open WedgeBooks</Link> : null}{result.entitlements?.clockIn?.enabled ? <Link href="/manager-login" className="rounded-xl border border-[#20282c]/15 px-5 py-4 text-center font-bold">Open WedgeCLOCKin</Link> : null}</div></div> : null}

          {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
