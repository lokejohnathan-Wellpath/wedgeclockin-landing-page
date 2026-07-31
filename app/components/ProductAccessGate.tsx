"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  clearProductToken,
  productConfig,
  productRequest,
  productToken,
  type PaidProduct,
  type ProductSubscription,
} from "../lib/productAccess";

type Session = {
  account: {
    id: string;
    product: PaidProduct;
    businessName: string;
    ownerName: string;
    email: string;
  };
  subscription: ProductSubscription;
};

export default function ProductAccessGate({
  product,
  children,
}: {
  product: PaidProduct;
  children: ReactNode;
}) {
  const router = useRouter();
  const config = productConfig[product];
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (!productToken(product)) {
      router.replace(`${config.basePath}/login`);
      return;
    }
    productRequest<Session>(product, "/api/saas/auth/session")
      .then((result) => {
        if (result.account.product !== product) {
          clearProductToken(product);
          router.replace(`${config.basePath}/login`);
          return;
        }
        setSession(result);
        if (result.subscription.status === "TRIAL_EXPIRING") {
          const today = new Date().toISOString().slice(0, 10);
          const reminderKey = `wedge_subscription_reminder_${product}_${today}`;
          if (!localStorage.getItem(reminderKey)) {
            localStorage.setItem(reminderKey, "shown");
            setShowReminder(true);
          }
        }
      })
      .catch((caught) => {
        const message = caught instanceof Error ? caught.message : "Access check failed.";
        setError(message);
        if (!productToken(product)) router.replace(`${config.basePath}/login`);
      })
      .finally(() => setLoading(false));
  }, [config.basePath, product, router]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0d1316] text-[#f1dfbc]">
        Checking {config.name} access…
      </main>
    );
  }
  if (!session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0d1316] px-6 text-center text-white">
        <div>
          <h1 className="text-2xl font-bold">{error || "Login is required."}</h1>
          <a className="mt-6 inline-block rounded-full bg-[#d2aa62] px-6 py-3 font-bold text-black" href={`${config.basePath}/login`}>
            Product Login
          </a>
        </div>
      </main>
    );
  }

  const blocked = !session.subscription.canWrite;
  if (blocked) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0d1316] px-6 text-center text-white">
        <section className="max-w-xl rounded-[2rem] border border-white/10 bg-[#172026] p-8 shadow-2xl">
          <p className="text-xs font-bold tracking-[.22em] text-[#d2aa62]">{config.eyebrow}</p>
          <h1 className="mt-4 font-serif text-4xl">Your 30-day trial has ended.</h1>
          <p className="mt-5 leading-7 text-white/60">
            Your existing records remain stored. Subscribe to continue using {config.name}.
          </p>
          <a href={`${config.basePath}/payment`} className="mt-7 inline-flex rounded-full bg-[#d2aa62] px-7 py-4 font-bold text-black">
            Continue Subscription
          </a>
          <button
            onClick={() => {
              clearProductToken(product);
              router.replace(`${config.basePath}/login`);
            }}
            className="mt-4 block w-full text-sm text-white/50 underline"
          >
            Log out
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      {session.subscription.status === "TRIAL_EXPIRING" && (
        <div className="sticky top-0 z-[100] bg-[#d2aa62] px-4 py-2 text-center text-xs font-bold text-[#152024]">
          Your free trial ends in {session.subscription.daysRemaining} day{session.subscription.daysRemaining === 1 ? "" : "s"}.{" "}
          <a className="underline" href={`${config.basePath}/payment`}>Subscribe to continue</a>
        </div>
      )}
      {children}
      {showReminder && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/65 px-5 backdrop-blur-sm">
          <section className="max-w-md rounded-[2rem] bg-white p-7 text-[#20282c] shadow-2xl">
            <p className="text-xs font-bold tracking-[.2em] text-[#b08745]">TRIAL REMINDER</p>
            <h2 className="mt-3 font-serif text-3xl">Keep {config.name} working without interruption.</h2>
            <p className="mt-4 leading-7 text-[#657074]">
              Your trial ends in {session.subscription.daysRemaining} day{session.subscription.daysRemaining === 1 ? "" : "s"}. Subscribe now or continue your trial and decide later.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a href={`${config.basePath}/payment`} className="rounded-xl bg-[#20282c] px-5 py-3 text-center font-bold text-white">Subscribe now</a>
              <button onClick={() => setShowReminder(false)} className="rounded-xl border border-[#20282c]/15 px-5 py-3 font-bold">Remind me later</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
