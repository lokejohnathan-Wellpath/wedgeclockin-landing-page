"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SMARTPOS_TOKEN_KEY, smartPosRequest } from "../lib/api";

export default function SmartPosSignup() {
  const router = useRouter();
  const [vertical, setVertical] = useState<"beauty" | "pet">("beauty");
  const [step, setStep] = useState<"details" | "code" | "password">("details");
  const [challengeId, setChallengeId] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function begin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget);
    try {
      const result = await smartPosRequest<{ challengeId: string }>("/api/smartpos/auth/signup/start", { method: "POST", body: JSON.stringify({ ownerName: form.get("ownerName"), businessName: form.get("businessName"), vertical, email: form.get("email"), telephone: form.get("telephone"), businessAddress: form.get("businessAddress"), acceptedTerms: form.get("acceptedTerms") === "on" }) });
      setChallengeId(result.challengeId); setStep("code");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Registration failed."); }
    finally { setBusy(false); }
  }
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); const form = new FormData(event.currentTarget);
    try { const result = await smartPosRequest<{verificationToken:string}>("/api/smartpos/auth/signup/verify",{method:"POST",body:JSON.stringify({challengeId,code:form.get("code")})}); setVerificationToken(result.verificationToken); setStep("password"); }
    catch(caught){setError(caught instanceof Error?caught.message:"Verification failed.");}finally{setBusy(false);}
  }
  async function complete(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");const form=new FormData(event.currentTarget);if(form.get("password")!==form.get("confirm")){setError("Passwords do not match.");setBusy(false);return;}try{const result=await smartPosRequest<{token:string;vertical:"beauty"|"pet"}>("/api/smartpos/auth/signup/complete",{method:"POST",body:JSON.stringify({challengeId,verificationToken,password:form.get("password")})});localStorage.setItem(SMARTPOS_TOKEN_KEY,result.token);router.push(`/wedge-smartpos/${result.vertical}`);}catch(caught){setError(caught instanceof Error?caught.message:"Registration failed.");}finally{setBusy(false);}}

  return <AuthShell title="Start Your 30-Day Free Trial" text="Register your business, verify your email and create your password.">
    {step==="details"&&<form onSubmit={begin} className="space-y-4"><div className="grid grid-cols-2 gap-2"><Choice active={vertical === "beauty"} onClick={() => setVertical("beauty")} label="Beauty & Wellness"/><Choice active={vertical === "pet"} onClick={() => setVertical("pet")} label="Pet Care"/></div><Field name="ownerName" label="Your full name" autoComplete="name"/><Field name="businessName" label="Business name" autoComplete="organization"/><Field name="email" label="Valid email address" type="email" autoComplete="email"/><Field name="telephone" label="Telephone number" type="tel" autoComplete="tel"/><label className="block text-sm font-semibold">Business address<textarea name="businessAddress" required rows={3} className={inputClass}/></label><label className="flex items-start gap-3 text-xs leading-5 text-[#657074]"><input name="acceptedTerms" required type="checkbox" className="mt-1 accent-[#5e8983]"/>I agree to the Wedge Works Terms and Privacy Policy.</label><Action busy={busy} label="Send Verification Code"/></form>}
    {step==="code"&&<form onSubmit={verify} className="space-y-4"><p className="rounded-xl bg-[#5e8983]/10 p-4 text-sm text-[#35645e]">Enter the six-digit code sent to your email.</p><Field name="code" label="Verification code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}/><Action busy={busy} label="Verify Email"/></form>}
    {step==="password"&&<form onSubmit={complete} className="space-y-4"><Field name="password" label="Create password" type="password" autoComplete="new-password" minLength={8}/><Field name="confirm" label="Confirm password" type="password" autoComplete="new-password" minLength={8}/><Action busy={busy} label="Start Free Trial"/></form>}
    {error&&<p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<p className="mt-5 text-center text-sm text-[#657074]">Already registered? <Link href="/wedge-smartpos/login" className="font-bold text-[#497973]">Merchant Login</Link></p>
  </AuthShell>;
}

export function AuthShell({title,text,children}:{title:string;text:string;children:React.ReactNode}) { return <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(210,170,98,.18),transparent_30%),#f3efe7] px-5 py-10 text-[#20282c]"><div className="mx-auto max-w-lg"><Link href="/wedge-smartpos" className="mb-8 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#20282c] font-black text-[#f1dfbc]">W</span><b>Wedge-SmartPOS</b></Link><section className="rounded-[28px] border border-[#20282c]/10 bg-white p-6 shadow-[0_24px_70px_rgba(32,40,44,.12)] sm:p-9"><p className="text-xs font-bold tracking-[.22em] text-[#b08745]">MERCHANT ACCESS</p><h1 className="mt-3 font-serif text-4xl">{title}</h1><p className="mt-3 text-sm leading-6 text-[#657074]">{text}</p><div className="mt-7">{children}</div></section></div></main>; }
const inputClass = "mt-2 w-full rounded-xl border border-[#20282c]/15 bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#5e8983]";
function Field(props: React.InputHTMLAttributes<HTMLInputElement> & {label:string;name:string}) { const {label,...input}=props; return <label className="block text-sm font-semibold">{label}<input {...input} required className={inputClass}/></label>; }
function Choice({active,onClick,label}:{active:boolean;onClick:()=>void;label:string}) { return <button type="button" onClick={onClick} className={`rounded-xl border px-3 py-3 text-sm font-bold ${active ? "border-[#5e8983] bg-[#5e8983]/10 text-[#497973]" : "border-[#20282c]/10"}`}>{label}</button>; }
function Action({busy,label}:{busy:boolean;label:string}){return <button disabled={busy} className="w-full rounded-xl bg-[#20282c] px-5 py-4 font-bold text-white disabled:opacity-60">{busy?"Please wait...":label}</button>;}
