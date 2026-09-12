"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FOUNDER_TOKEN_KEY } from "../../lib/founderApi";

export default function ManagedAccountsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [businessId, setBusinessId] = useState("");

  useEffect(() => {
    const hasFounderToken = Boolean(localStorage.getItem(FOUNDER_TOKEN_KEY));
    setAllowed(hasFounderToken);
    setBusinessId(new URLSearchParams(window.location.search).get("businessId") || "");
    setChecked(true);
    if (!hasFounderToken) router.replace("/founder-john-control");
  }, [pathname, router]);

  if (!checked || !allowed) {
    return <main className="grid min-h-screen place-items-center bg-[#090d10] px-6 text-center text-[#f4efe6]"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#c8a467]/30 bg-[#c8a467]/10 font-bold text-[#d9b979]">W</div><p className="mt-4 text-sm font-semibold text-[#f0dfbd]">Opening secure Wedge Accounts workspace…</p></div></main>;
  }

  const suffix = businessId ? `?businessId=${encodeURIComponent(businessId)}` : "";
  const navItems = businessId ? [
    { href: `/wedge-i${suffix}`, label: "Business Control" },
    { href: `/wedge-i/accounts/pnl${suffix}`, label: "P&L Workspace" },
    { href: `/wedge-i/accounts/reconciliation${suffix}`, label: "Reconciliation" },
    { href: `/wedge-i/accounts/pnl-templates${suffix}`, label: "P&L Templates" },
  ] : [{ href: "/founder-john-control/businesses", label: "Managed Businesses" }];

  return (
    <div className="min-h-screen bg-[#090d10]">
      <div className="sticky top-0 z-[160] border-b border-white/10 bg-[#0a0f12]/95 px-4 py-3 text-[#f4efe6] backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center justify-between gap-4"><Link href={businessId ? `/wedge-i${suffix}` : "/founder-john-control/businesses"} className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border border-[#c8a467]/30 bg-[#c8a467]/10 font-bold text-[#d9b979]">W</span><span><span className="block text-xs font-bold tracking-[.16em] text-[#c8a467]">WEDGE-I</span><span className="block text-[10px] text-white/35">Internal accounts workspace</span></span></Link></div>
          <nav className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">{navItems.map((item) => <Link key={item.href} href={item.href} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${pathname === item.href.split("?")[0] ? "bg-[#c8a467] text-[#111416]" : "border border-white/10 bg-white/[.03] text-white/55 hover:text-white"}`}>{item.label}</Link>)}</nav>
          <Link href="/founder-john-control/businesses" className="text-xs font-semibold text-white/45 hover:text-white">Managed Businesses →</Link>
        </div>
      </div>
      {children}
    </div>
  );
}
