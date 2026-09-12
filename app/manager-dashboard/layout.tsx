"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import ClockInSubscriptionBanner from "../components/ClockInSubscriptionBanner";

export default function ManagerDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (localStorage.getItem("wc_manager_token")) {
      setAllowed(true);
      return;
    }
    setAllowed(false);
    router.replace("/manager-login");
  }, [router]);

  if (!allowed) {
    return <main className="flex min-h-screen items-center justify-center bg-[#101416] text-[#f0dfbd]">Checking WedgeCLOCKin access…</main>;
  }

  return <><ClockInSubscriptionBanner />{children}</>;
}
