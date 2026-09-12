"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyPnlRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const businessId = params.get("businessId") || "";
    const period = params.get("period") || "";
    const target = new URLSearchParams();
    if (businessId) target.set("businessId", businessId);
    if (period) target.set("period", period);
    target.set("view", "pnl");
    router.replace(`/wedge-i/accounts/accounting?${target.toString()}`);
  }, [router]);
  return <main className="grid min-h-screen place-items-center bg-[#090d10] text-sm text-white/50">Opening ledger-derived Management P&amp;L…</main>;
}
