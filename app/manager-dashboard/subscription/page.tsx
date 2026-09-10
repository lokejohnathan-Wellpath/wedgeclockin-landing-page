"use client";

import { useEffect, useState } from "react";
import { customerSafeMessage } from "../../lib/customerMessages";

type Subscription={status:string;trialEndsAt?:string;daysRemaining:number;currentPeriodEnd?:string};

async function apiRequest<T>(path:string,init:RequestInit={},authenticated=true):Promise<T>{
  const base=process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/,"");
  if(!base)throw new Error("API is not configured.");
  const token=localStorage.getItem("wc_manager_token");
  const response=await fetch(`${base}${path}`,{...init,headers:{"Content-Type":"application/json",...(authenticated&&token?{Authorization:`Bearer ${token}`}:{ }),...init.headers}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(customerSafeMessage(data?.message,"Request failed."));
  return data as T;
}

export default function ClockInSubscriptionPage(){
  const[sub,setSub]=useState<Subscription|null>(null);
  const[error,setError]=useState("");

  useEffect(()=>{
    apiRequest<Subscription>("/api/auth/subscription")
      .then(setSub)
      .catch(e=>setError(e instanceof Error?e.message:"Status could not be loaded."));
  },[]);

  return <main className="min-h-screen bg-[#f4f0e8] px-5 py-12 text-[#20282c]">
    <div className="mx-auto max-w-4xl">
      <a href="/manager-dashboard" className="font-bold text-[#9a6a22]">← Manager Dashboard</a>
      <div className="mt-8 grid overflow-hidden rounded-[2rem] border border-[#20282c]/10 bg-white shadow-xl lg:grid-cols-[1fr_.75fr]">
        <section className="p-7 sm:p-10">
          <p className="text-xs font-bold tracking-[.22em] text-[#b08745]">ACCESS & SERVICE</p>
          <h1 className="mt-3 font-serif text-4xl">WedgeCLOCKin access</h1>
          <p className="mt-4 leading-7 text-[#657074]">
            Public package pricing and online checkout are temporarily hidden while Wedge is onboarding businesses directly.
          </p>
          <div className="mt-7 rounded-2xl border border-[#b08745]/20 bg-[#f8f3ea] p-5 text-sm leading-6 text-[#5f686c]">
            Your attendance and employee records remain protected. Access continuation and managed-service arrangements are handled directly by the Wedge team during the current pilot period.
          </div>
        </section>
        <aside className="bg-[#20282c] p-7 text-white sm:p-10">
          <p className="text-xs font-bold tracking-[.2em] text-[#d4ad63]">YOUR COMPANY</p>
          <p className="mt-6 text-sm text-white/45">Current status</p>
          <p className="mt-1 text-xl font-bold">{sub?.status?.replaceAll("_"," ")||"Loading..."}</p>
          {sub?.trialEndsAt&&<><p className="mt-6 text-sm text-white/45">Current access ends</p><p className="mt-1 font-semibold">{new Date(sub.trialEndsAt).toLocaleDateString("en-MY",{dateStyle:"long"})}</p></>}
          {error&&<p className="mt-6 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        </aside>
      </div>
    </div>
  </main>;
}
