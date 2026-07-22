"use client";

import { FormEvent, useState } from "react";
import { AuthShell } from "../signup/page";
import { smartPosRequest } from "../lib/api";

export default function ForgotPassword(){
  const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);const form=new FormData(event.currentTarget);try{await smartPosRequest("/api/smartpos/auth/forgot-password",{method:"POST",body:JSON.stringify({email:form.get("email")})});setMessage("If this email is registered, password reset instructions have been sent.");}catch{setMessage("If this email is registered, password reset instructions have been sent.");}finally{setBusy(false);}}
  return <AuthShell title="Reset Your Password" text="Enter the email used to register your business."><form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold">Email address<input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-[#20282c]/15 bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#5e8983]"/></label>{message&&<p className="rounded-xl border border-[#5e8983]/20 bg-[#5e8983]/10 p-3 text-sm text-[#35645e]">{message}</p>}<button disabled={busy} className="w-full rounded-xl bg-[#20282c] px-5 py-4 font-bold text-white disabled:opacity-60">{busy?"Sending...":"Send Reset Instructions"}</button><a href="/wedge-smartpos/login" className="block text-center text-sm font-bold text-[#497973]">Back to Merchant Login</a></form></AuthShell>;
}
