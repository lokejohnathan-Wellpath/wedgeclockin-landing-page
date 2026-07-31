"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const subscribe = () => () => undefined;

export default function ManagerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const hasSession = useSyncExternalStore(
    subscribe,
    () => Boolean(localStorage.getItem("wc_manager_token")),
    () => false,
  );

  useEffect(() => {
    if (!localStorage.getItem("wc_manager_token")) {
      router.replace("/manager-login");
    }
  }, [router]);

  if (!hasSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#101416] text-[#f0dfbd]">
        Checking manager access…
      </main>
    );
  }

  return children;
}
