"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { loadOwnerSession, ownerToken } from "../lib/ownerAccess";
import { clearFreeBusinessProfile, getFreeBusinessProfile } from "./services/freeBusinessClient";

export default function WedgeILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [registeredBusiness, setRegisteredBusiness] = useState<string | null>(null);
  const [cloudBacked, setCloudBacked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function refreshLocal() {
      const profile = getFreeBusinessProfile();
      if (!cancelled) setRegisteredBusiness(profile?.tradingName || profile?.legalName || null);
    }

    refreshLocal();

    async function refreshCloud() {
      if (!ownerToken()) {
        if (!cancelled) setCloudBacked(false);
        return;
      }
      try {
        const result = await loadOwnerSession();
        if (cancelled) return;
        setRegisteredBusiness(result.business.tradingName || result.business.legalName || null);
        setCloudBacked(true);
      } catch {
        if (cancelled) return;
        clearFreeBusinessProfile();
        setRegisteredBusiness(null);
        setCloudBacked(false);
      }
    }

    void refreshCloud();
    window.addEventListener("wedge-free-business-changed", refreshLocal);
    return () => {
      cancelled = true;
      window.removeEventListener("wedge-free-business-changed", refreshLocal);
    };
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
                {registeredBusiness
                  ? `${registeredBusiness} · ${cloudBacked ? "saved in Wedge cloud until Founder deletes it" : "business profile saved on this device"}`
                  : "Try Wedge-I free, then register your business for permanent cloud continuity and Founder approval."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/wedge-i/pnl"
                className="rounded-full border border-[#20282c]/15 bg-white px-5 py-2.5 text-xs font-bold text-[#20282c]"
              >
                Management P&amp;L
              </Link>
              <Link
                href="/wedge-i/register"
                className="rounded-full bg-[#20282c] px-5 py-2.5 text-xs font-bold text-white"
              >
                {registeredBusiness ? "Business Profile" : "Register Business"}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}
