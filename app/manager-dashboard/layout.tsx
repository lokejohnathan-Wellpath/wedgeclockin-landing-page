"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import ClockInSubscriptionBanner from "../components/ClockInSubscriptionBanner";
import { ensureOwnerProductAccess, ownerToken } from "../lib/ownerAccess";

export default function ManagerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (localStorage.getItem("wc_manager_token")) {
        if (!cancelled) setAllowed(true);
        return;
      }
      if (ownerToken()) {
        try {
          const ready = await ensureOwnerProductAccess("clockIn");
          if (!cancelled && ready) {
            setAllowed(true);
            return;
          }
        } catch {
          // Fall through to owner dashboard rather than showing a manager credential screen.
        }
        if (!cancelled) {
          setAllowed(false);
          router.replace("/client-dashboard");
        }
        return;
      }
      if (!cancelled) {
        setAllowed(false);
        router.replace("/manager-login");
      }
    }
    void check();
    return () => { cancelled = true; };
  }, [router]);

  if (!allowed) {
    return <main className="flex min-h-screen items-center justify-center bg-[#101416] text-[#f0dfbd]">Checking WedgeCLOCKin access…</main>;
  }

  return <><ClockInSubscriptionBanner />{children}</>;
}
