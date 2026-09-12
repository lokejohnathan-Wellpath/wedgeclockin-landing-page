"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FOUNDER_TOKEN_KEY, founderRequest } from "../lib/founderApi";

export default function WedgeILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [businessId, setBusinessId] = useState("");

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem(FOUNDER_TOKEN_KEY) || "";
    if (!token) {
      router.replace("/founder-john-control");
      return;
    }
    setBusinessId(new URLSearchParams(window.location.search).get("businessId") || "");
    founderRequest<{ success: true }>("/api/founder/control/businesses")
      .then(() => { if (!cancelled) setReady(true); })
      .catch(() => { if (!cancelled) router.replace("/founder-john-control"); });
    return () => { cancelled = true; };
  }, [pathname, router]);

  if (!ready) {
    return <main className="grid min-h-screen place-items-center bg-[#090d10] px-6 text-center text-[#f0dfbd]">Opening Wedge internal workspace…</main>;
  }

  const suffix = businessId ? `?businessId=${encodeURIComponent(businessId)}` : "";

  return (
    <>
      <div className="border-b border-white/10 bg-[#0b1013] px-5 py-3 text-[#f4efe6] sm:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#c8a467]">WEDGE-I · INTERNAL</p><p className="mt-0.5 text-xs text-white/45">Founder / accounts workspace. Clients only use WedgeCLOCKin and document capture.</p></div>
          <div className="flex flex-wrap gap-2">
            <Link href="/founder-john-control/businesses" className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60">Managed Businesses</Link>
            {businessId ? <>
              <Link href={`/wedge-i${suffix}`} className="rounded-full border border-[#c8a467]/30 px-4 py-2 text-xs font-bold text-[#e5ca93]">Control</Link>
              <Link href={`/wedge-i/books${suffix}`} className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60">Books</Link>
              <Link href={`/wedge-i/payroll${suffix}`} className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60">Payroll</Link>
              <Link href={`/wedge-i/accounts/reconciliation${suffix}`} className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60">Reconcile</Link>
              <Link href={`/wedge-i/accounts/pnl${suffix}`} className="rounded-full bg-[#c8a467] px-4 py-2 text-xs font-bold text-[#111416]">P&amp;L</Link>
            </> : null}
          </div>
        </div>
      </div>
      {children}
    </>
  );
}
