"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { getFreeBusinessProfile } from "./services/freeBusinessClient";

export default function WedgeILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [registeredBusiness, setRegisteredBusiness] = useState<string | null>(null);

  useEffect(() => {
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
                {registeredBusiness ? `${registeredBusiness} · business profile` : "Try Wedge-I free, then register your business for continuity and Founder approval."}
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
      {children}
    </>
  );
}
