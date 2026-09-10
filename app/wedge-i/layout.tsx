"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { FOUNDER_TOKEN_KEY } from "../lib/founderApi";
import { getFreeBusinessProfile } from "./services/freeBusinessClient";

export default function WedgeILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [hasFounderAccess, setHasFounderAccess] = useState(false);
  const [registeredBusiness, setRegisteredBusiness] = useState<string | null>(null);

  useEffect(() => {
    setHasFounderAccess(Boolean(localStorage.getItem(FOUNDER_TOKEN_KEY)));
    const profile = getFreeBusinessProfile();
    setRegisteredBusiness(profile?.tradingName || profile?.legalName || null);

    const refresh = () => {
      const updated = getFreeBusinessProfile();
      setRegisteredBusiness(updated?.tradingName || updated?.legalName || null);
    };
    window.addEventListener("wedge-free-business-changed", refresh);
    return () => window.removeEventListener("wedge-free-business-changed", refresh);
  }, [pathname]);

  const insideManagedAccounts = pathname.startsWith("/wedge-i/accounts");
  const insideRegistration = pathname.startsWith("/wedge-i/register");

  return (
    <>
      {!insideManagedAccounts && !insideRegistration ? (
        <div className="border-b border-[#20282c]/10 bg-[#f5f1e8] px-5 py-3 text-[#20282c] sm:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#9a7130]">Wedge-I Business</p>
              <p className="mt-0.5 text-xs text-[#657074]">
                {registeredBusiness ? `${registeredBusiness} · registered on this device` : "Try Wedge-I free, then register your business when you want memory and continuity."}
              </p>
            </div>
            <Link
              href="/wedge-i/register"
              className="rounded-full bg-[#20282c] px-5 py-2.5 text-xs font-bold text-white"
            >
              {registeredBusiness ? "Business Profile" : "Register Business"}
            </Link>
          </div>
        </div>
      ) : null}

      {hasFounderAccess && !insideManagedAccounts && !insideRegistration ? (
        <div className="border-b border-[#c8a467]/20 bg-[#0a0e11]/95 px-5 py-3 text-[#f4efe6] shadow-[0_12px_40px_rgba(0,0,0,.22)] backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#c8a467]">Founder Workspace</p>
              <p className="mt-0.5 text-xs text-white/45">Wedge-I intelligence + managed full-set accounts</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/wedge-i/accounts" className="rounded-full bg-[#c8a467] px-4 py-2 text-xs font-bold text-[#111416]">Managed Accounts</Link>
              <Link href="/wedge-i/accounts/pnl" className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-white/70">P&amp;L Workspace</Link>
              <Link href="/wedge-i/accounts/pnl-templates" className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-semibold text-white/70">Industry Templates</Link>
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}
