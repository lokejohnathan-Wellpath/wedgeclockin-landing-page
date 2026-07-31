"use client";

import { useEffect, useState } from "react";

type Subscription = {
  status: string;
  daysRemaining: number;
  canWrite: boolean;
};

export default function ClockInSubscriptionBanner() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [showReminder, setShowReminder] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("wc_manager_token");
    const api = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
    if (!token || !api) return;
    fetch(`${api}/api/auth/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || "Subscription check failed.");
        return data as Subscription;
      })
      .then((result) => {
        setSubscription(result);
        if (result.status === "TRIAL_EXPIRING") {
          const key = `clockin_trial_reminder_${new Date().toISOString().slice(0, 10)}`;
          if (!localStorage.getItem(key)) {
            localStorage.setItem(key, "shown");
            setShowReminder(true);
          }
        }
      })
      .catch(() => undefined);
  }, []);
  if (!subscription) return null;
  const expiring = subscription.status === "TRIAL_EXPIRING";
  const blocked = !subscription.canWrite;
  return (
    <>
      {(expiring || blocked) && (
        <div className={`${blocked ? "bg-[#a64f48] text-white" : "bg-[#d4ad63] text-black"} px-4 py-2 text-center text-xs font-bold`}>
          {blocked
            ? "Your trial has ended. Records remain available, but changes are paused."
            : `Your free trial ends in ${subscription.daysRemaining} day${subscription.daysRemaining === 1 ? "" : "s"}.`} {" "}
          <a href="/manager-dashboard/subscription" className="underline">Continue subscription</a>
        </div>
      )}
      {showReminder && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/70 px-5 backdrop-blur-sm">
          <section className="max-w-md rounded-[2rem] bg-[#f4efe6] p-7 text-[#20282c] shadow-2xl">
            <p className="text-xs font-bold tracking-[.2em] text-[#b08745]">TRIAL REMINDER</p>
            <h2 className="mt-3 font-serif text-3xl">Keep your Clock-In records moving.</h2>
            <p className="mt-4 leading-7 text-[#657074]">Your trial ends in {subscription.daysRemaining} day{subscription.daysRemaining === 1 ? "" : "s"}. Subscribe now or continue testing until the trial ends.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2"><a href="/manager-dashboard/subscription" className="rounded-xl bg-[#20282c] px-5 py-3 text-center font-bold text-white">Subscribe now</a><button onClick={() => setShowReminder(false)} className="rounded-xl border border-[#20282c]/15 px-5 py-3 font-bold">Remind me later</button></div>
          </section>
        </div>
      )}
    </>
  );
}
