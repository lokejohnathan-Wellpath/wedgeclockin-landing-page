"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ownerPasswordRequest } from "../lib/ownerAccess";

const inputClass = "mt-2 w-full rounded-xl border border-[#20282c]/15 bg-white px-4 py-3 outline-none focus:border-[#b4873b]";

export default function ClientForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "password" | "done">("email");
  const [challengeId, setChallengeId] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await ownerPasswordRequest<{ challengeId: string }>("start", { email: form.get("email") });
      setChallengeId(result.challengeId); setStep("code");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Password reset could not start."); }
    finally { setBusy(false); }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await ownerPasswordRequest<{ verificationToken: string }>("verify", { challengeId, code: form.get("code") });
      setVerificationToken(result.verificationToken); setStep("password");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Verification failed."); }
    finally { setBusy(false); }
  }

  async function complete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("confirm")) { setError("Passwords do not match."); setBusy(false); return; }
    try {
      await ownerPasswordRequest("complete", { challengeId, verificationToken, password: form.get("password") });
      setStep("done");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Password could not be changed."); }
    finally { setBusy(false); }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f1e8] px-5 py-10 text-[#20282c]">
      <section className="w-full max-w-lg rounded-[30px] border border-[#20282c]/10 bg-[#fffdf8] p-7 shadow-[0_24px_70px_rgba(32,40,44,.10)] sm:p-9">
        <Link href="/client-login" className="text-sm font-semibold text-[#8b692f]">← Client Login</Link>
        <h1 className="mt-6 font-serif text-4xl">Reset owner password</h1>
        <p className="mt-3 text-sm leading-6 text-[#657074]">We will verify the approved owner email before changing the password used for the Client Dashboard.</p>

        {step === "email" ? <form onSubmit={start} className="mt-7 space-y-4"><label className="block text-sm font-semibold">Owner email<input name="email" required type="email" autoComplete="email" className={inputClass}/></label><Action busy={busy} label="Send Verification Code"/></form> : null}
        {step === "code" ? <form onSubmit={verify} className="mt-7 space-y-4"><label className="block text-sm font-semibold">Verification code<input name="code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} className={inputClass}/></label><Action busy={busy} label="Verify Email"/></form> : null}
        {step === "password" ? <form onSubmit={complete} className="mt-7 space-y-4"><label className="block text-sm font-semibold">New password<input name="password" required type="password" minLength={8} autoComplete="new-password" className={inputClass}/></label><label className="block text-sm font-semibold">Confirm password<input name="confirm" required type="password" minLength={8} autoComplete="new-password" className={inputClass}/></label><Action busy={busy} label="Change Password"/></form> : null}
        {step === "done" ? <div className="mt-7 rounded-2xl border border-emerald-700/15 bg-emerald-50 p-5 text-sm text-emerald-900"><b>Password changed.</b><div className="mt-4"><Link href="/client-login" className="font-bold underline">Return to Client Login</Link></div></div> : null}
        {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      </section>
    </main>
  );
}

function Action({ busy, label }: { busy: boolean; label: string }) {
  return <button disabled={busy} className="w-full rounded-xl bg-[#20282c] px-5 py-4 font-bold text-white disabled:opacity-50">{busy ? "Please wait…" : label}</button>;
}
