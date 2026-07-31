"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

const destinations: Record<string, string> = {
  clockin: "/manager-dashboard",
  books: "/wedge-i/books",
  smartpos: "/wedge-smartpos",
  erp: "/wedge-supply",
};

function SubscriptionSuccessContent() {
  const params = useSearchParams();
  const product = params.get("product") || "";
  const destination = destinations[product] || "/";
  return (
    <main className="grid min-h-screen place-items-center bg-[#0d1316] px-6 text-center text-white">
      <section className="max-w-lg rounded-[2rem] border border-white/10 bg-[#172026] p-8 shadow-2xl">
        <p className="text-xs font-bold tracking-[.22em] text-[#d2aa62]">PAYMENT RECEIVED</p>
        <h1 className="mt-4 font-serif text-4xl">Your access is being activated.</h1>
        <p className="mt-5 leading-7 text-white/60">Secure confirmation normally arrives within moments. Return to your product and refresh once.</p>
        <a href={destination} className="mt-7 inline-flex rounded-full bg-[#d2aa62] px-7 py-4 font-bold text-black">Return to Wedge Works</a>
      </section>
    </main>
  );
}

function SubscriptionSuccessFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0d1316] px-6 text-center text-white">
      <p className="text-sm text-white/60">Confirming your subscription…</p>
    </main>
  );
}

export default function SubscriptionSuccess() {
  return (
    <Suspense fallback={<SubscriptionSuccessFallback />}>
      <SubscriptionSuccessContent />
    </Suspense>
  );
}
