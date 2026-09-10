"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FOUNDER_TOKEN_KEY } from "../../lib/founderApi";

const navItems = [
  { href: "/wedge-i/accounts", label: "Control Centre" },
  { href: "/wedge-i/accounts/pnl", label: "P&L Workspace" },
  { href: "/wedge-i/accounts/pnl-templates", label: "P&L Templates" },
  { href: "/wedge-i/accounts/reconciliation", label: "Reconciliation" },
  { href: "/wedge-i/accounts/new", label: "Add Client" },
];

export default function ManagedAccountsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const hasFounderToken = Boolean(localStorage.getItem(FOUNDER_TOKEN_KEY));
    setAllowed(hasFounderToken);
    setChecked(true);

    if (!hasFounderToken) {
      router.replace("/founder-john-control");
    }
  }, [router]);

  if (!checked || !allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#090d10] px-6 text-center text-[#f4efe6]">
        <div>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-[#c8a467]/30 bg-[#c8a467]/10 font-bold text-[#d9b979]">W</div>
          <p className="mt-4 text-sm font-semibold text-[#f0dfbd]">Opening secure Wedge Accounts workspace…</p>
          <p className="mt-2 text-xs text-white/40">Founder authentication is required.</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d10]">
      <div className="sticky top-0 z-[160] border-b border-white/10 bg-[#0a0f12]/95 px-4 py-3 text-[#f4efe6] backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/wedge-i" className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-[#c8a467]/30 bg-[#c8a467]/10 font-bold text-[#d9b979]">W</span>
              <span>
                <span className="block text-xs font-bold tracking-[.16em] text-[#c8a467]">WEDGE-I</span>
                <span className="block text-[10px] text-white/35">Managed Accounts</span>
              </span>
            </Link>
            <Link href="/founder-john-control/dashboard" className="text-xs font-semibold text-white/45 hover:text-white xl:hidden">Founder Control</Link>
          </div>

          <nav className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
            {navItems.map((item) => {
              const exact = item.href === "/wedge-i/accounts";
              const active = exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-[#c8a467] text-[#111416]"
                      : "border border-white/10 bg-white/[.03] text-white/55 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link href="/founder-john-control/dashboard" className="hidden text-xs font-semibold text-white/45 hover:text-white xl:block">Founder Control →</Link>
        </div>
      </div>

      {children}
    </div>
  );
}
