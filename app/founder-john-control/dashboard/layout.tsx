"use client";

import Link from "next/link";

export default function FounderDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="border-b border-[#d2aa62]/20 bg-[#0a0f12] px-5 py-3 text-[#f3efe7]">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#d2aa62]">Founder John Control</p>
            <p className="mt-1 text-xs text-white/40">Managed businesses · bookkeeping · reconciliation · payroll review · month close</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/founder-john-control/businesses" className="rounded-full bg-[#d2aa62] px-4 py-2 text-xs font-bold text-black">Managed Businesses</Link>
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
