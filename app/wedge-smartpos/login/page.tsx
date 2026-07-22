"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "../signup/page";
import { SMARTPOS_TOKEN_KEY, smartPosRequest } from "../lib/api";

export default function SmartPosLogin() {
  const router = useRouter(); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const form=new FormData(event.currentTarget); try { const result=await smartPosRequest<{token:string;vertical:"beauty"|"pet"}>("/api/smartpos/auth/login",{method:"POST",body:JSON.stringify({email:form.get("email"),password:form.get("password")})}); localStorage.setItem(SMARTPOS_TOKEN_KEY,result.token); router.push(`/wedge-smartpos/${result.vertical}`); } catch(caught){setError(caught instanceof Error?caught.message:"Login failed.");} finally{setBusy(false);} }
  return <AuthShell title="Merchant Login" text="Enter your registered email and password."><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold">Email address<input name="email" type="email" autoComplete="email" required className={inputClass}/></label><label className="block text-sm font-semibold">Password<input name="password" type="password" autoComplete="current-password" required className={inputClass}/></label><div className="text-right"><a href="/wedge-smartpos/forgot-password" className="text-xs font-bold text-[#497973]">Forgot password?</a></div>{error&&<p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button disabled={busy} className="w-full rounded-xl bg-[#20282c] px-5 py-4 font-bold text-white disabled:opacity-60">{busy?"Logging in...":"Click Here to Enter Your POS"}</button><p className="text-center text-sm text-[#657074]">New merchant? <a href="/wedge-smartpos/signup" className="font-bold text-[#497973]">Start Free Trial</a></p></form></AuthShell>;
}
const inputClass="mt-2 w-full rounded-xl border border-[#20282c]/15 bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#5e8983]";
