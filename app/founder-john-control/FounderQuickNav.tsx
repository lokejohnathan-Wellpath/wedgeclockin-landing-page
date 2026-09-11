"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FOUNDER_TOKEN_KEY } from "../lib/founderApi";

export default function FounderQuickNav() {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(Boolean(localStorage.getItem(FOUNDER_TOKEN_KEY))), []);
  if (!visible) return null;

  return (
    <nav className="fixed bottom-4 left-1/2 z-[190] flex max-w-[calc(100vw-24px)] -translate-x-1/2 gap-1 overflow-x-auto rounded-full border border-white/10 bg-[#0d1316]/95 p-1.5 text-[11px] font-bold text-white/60 shadow-2xl backdrop-blur">
      <Link href="/founder-john-control/dashboard" className="whitespace-nowrap rounded-full px-4 py-2 hover:bg-white/5 hover:text-white">Dashboard</Link>
      <Link href="/founder-john-control/registrations" className="whitespace-nowrap rounded-full px-4 py-2 hover:bg-white/5 hover:text-white">Pending</Link>
      <Link href="/founder-john-control/businesses" className="whitespace-nowrap rounded-full bg-[#d2aa62] px-4 py-2 text-black">Approved Businesses</Link>
      <Link href="/wedge-i/accounts" className="whitespace-nowrap rounded-full px-4 py-2 hover:bg-white/5 hover:text-white">Managed Accounts</Link>
    </nav>
  );
}
