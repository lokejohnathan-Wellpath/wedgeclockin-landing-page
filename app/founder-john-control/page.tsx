"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FOUNDER_TOKEN_KEY, founderRequest } from "../lib/founderApi";

type Step = "credentials" | "code" | "reset-request" | "reset-complete";

export default function FounderLogin() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [challengeId, setChallengeId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    localStorage.removeItem(FOUNDER_TOKEN_KEY);
  }, []);

  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await founderRequest<{ challengeId: string }>(
        "/api/founder/auth/start",
        {
          method: "POST",
          body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
        },
        false,
      );
      setChallengeId(result.challengeId);
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await founderRequest<{ token: string }>(
        "/api/founder/auth/verify",
        {
          method: "POST",
          body: JSON.stringify({ challengeId, code: form.get("code") }),
        },
        false,
      );
      localStorage.setItem(FOUNDER_TOKEN_KEY, result.token);
      router.push("/founder-john-control/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await founderRequest<{ challengeId: string; message?: string }>(
        "/api/founder/auth/reset/start",
        {
          method: "POST",
          body: JSON.stringify({ email: form.get("email") }),
        },
        false,
      );
      setChallengeId(result.challengeId);
      setMessage(result.message || "A reset code has been sent to the Founder email.");
      setStep("reset-complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password reset could not be started.");
    } finally {
      setBusy(false);
    }
  }

  async function completeReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");
    if (newPassword !== confirmPassword) {
      setError("The two new passwords do not match.");
      setBusy(false);
      return;
    }
    try {
      const result = await founderRequest<{ success: true; message?: string }>(
        "/api/founder/auth/reset/complete",
        {
          method: "POST",
          body: JSON.stringify({ challengeId, code: form.get("code"), newPassword }),
        },
        false,
      );
      setChallengeId("");
      setStep("credentials");
      setMessage(result.message || "Founder password reset. You can sign in now.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password reset failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#080c0f] px-5 text-[#f3efe7]">
      <section className="w-full max-w-md rounded-[2rem] border border-[#d2aa62]/25 bg-[#121a1e] p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#d2aa62] font-black text-black">W</span>
          <div>
            <p className="font-bold text-[#f1dfbc]">Wedge Works Private Control</p>
            <p className="text-[10px] tracking-[.16em] text-white/35">PRIVATE OPERATING DESK</p>
          </div>
        </div>

        <h1 className="mt-8 font-serif text-4xl">{step.startsWith("reset") ? "Reset password" : "Private access"}</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">
          {step.startsWith("reset")
            ? "Founder email verification is required before a new password can be saved."
            : "Password and one-time email verification are required."}
        </p>

        {step === "credentials" ? (
          <form onSubmit={start} className="mt-7 space-y-4">
            <Field name="email" label="Founder email" type="email" />
            <Field name="password" label="Founder password" type="password" />
            <Action busy={busy} label="Send Private Login Code" />
            <button
              type="button"
              onClick={() => { setError(""); setMessage(""); setStep("reset-request"); }}
              className="w-full rounded-full border border-[#d2aa62]/30 px-6 py-3 text-sm font-bold text-[#f1dfbc] hover:bg-[#d2aa62]/10"
            >
              Forgot / Reset Founder Password
            </button>
          </form>
        ) : null}

        {step === "code" ? (
          <form onSubmit={verify} className="mt-7 space-y-4">
            <p className="rounded-xl bg-white/5 p-4 text-sm text-white/55">Enter the six-digit code sent to the private Founder email.</p>
            <Field name="code" label="Verification code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} />
            <Action busy={busy} label="Open Founder Dashboard" />
            <BackToLogin onClick={() => setStep("credentials")} />
          </form>
        ) : null}

        {step === "reset-request" ? (
          <form onSubmit={requestReset} className="mt-7 space-y-4">
            <Field name="email" label="Founder email" type="email" />
            <Action busy={busy} label="Send Password Reset Code" />
            <BackToLogin onClick={() => setStep("credentials")} />
          </form>
        ) : null}

        {step === "reset-complete" ? (
          <form onSubmit={completeReset} className="mt-7 space-y-4">
            <p className="rounded-xl bg-white/5 p-4 text-sm text-white/55">Enter the six-digit reset code and choose a new Founder password.</p>
            <Field name="code" label="Reset code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} />
            <Field name="newPassword" label="New Founder password" type="password" minLength={12} maxLength={128} />
            <Field name="confirmPassword" label="Confirm new password" type="password" minLength={12} maxLength={128} />
            <p className="text-xs leading-5 text-white/35">Use at least 12 characters with uppercase, lowercase, a number and a symbol.</p>
            <Action busy={busy} label="Reset Founder Password" />
            <BackToLogin onClick={() => setStep("credentials")} />
          </form>
        ) : null}

        {error ? <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
        {message ? <p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p> : null}
        <Link href="/" className="mt-6 block text-center text-xs text-white/35">Return to Wedge Works</Link>
      </section>
    </main>
  );
}

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#080c0f] px-4 py-3 text-white outline-none focus:border-[#d2aa62]";

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...input } = props;
  return <label className="block text-sm font-semibold text-white/65">{label}<input {...input} required className={inputClass} /></label>;
}

function Action({ busy, label }: { busy: boolean; label: string }) {
  return <button disabled={busy} className="w-full rounded-full bg-[#d2aa62] px-6 py-4 font-bold text-black disabled:opacity-60">{busy ? "Please wait..." : label}</button>;
}

function BackToLogin({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="w-full py-2 text-sm font-semibold text-white/45 hover:text-white">← Back to Founder login</button>;
}
