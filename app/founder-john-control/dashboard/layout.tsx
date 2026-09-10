"use client";

import Link from "next/link";

export default function FounderDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-[#d2aa62]/20 bg-[#0a0f12] px-5 py-3 text-[#f3efe7]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d2aa62]">Founder John Control</p>
            <p className="mt-1 text-xs text-white/40">Platform oversight, subscriptions, product access and managed-account conversion</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/wedge-i" className="rounded-full border border-white/10 bg-white/[.03] px-4 py-2 text-xs font-semibold text-white/65 hover:text-white">Open Wedge-I</Link>
            <Link href="/wedge-i/accounts" className="rounded-full border border-[#d2aa62]/30 bg-[#d2aa62]/10 px-4 py-2 text-xs font-semibold text-[#f1dfbc]">Managed Accounts</Link>
            <Link href="/wedge-i/accounts/new" className="rounded-full bg-[#d2aa62] px-4 py-2 text-xs font-bold text-black">+ Add Managed Account</Link>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
