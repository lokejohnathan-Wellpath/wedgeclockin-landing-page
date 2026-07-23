"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  emptySupplyState,
  hasCompletedSetup,
  loadSupplyState,
  saveSupplyState,
} from "./lib/supplyStore";
import type { SupplyConfig, SupplyState } from "./lib/types";

const inputClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1114] px-4 py-3.5 text-base text-white outline-none transition focus:border-[#d6ad62]";

export default function WedgeSupplyEntry() {
  const [state, setState] = useState<SupplyState>(emptySupplyState);
  const [config, setConfig] = useState<SupplyConfig>(emptySupplyState.config);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const stored = loadSupplyState();
      setState(stored);
      setConfig(stored.config);
      setEditing(!hasCompletedSetup(stored));
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  function updateConfig(field: keyof SupplyConfig, value: string) {
    setConfig((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function saveSetup() {
    if (
      !config.businessName.trim() ||
      !config.centralLocation.trim() ||
      !config.outletName.trim()
    ) {
      setError("Complete the three business fields before continuing.");
      return;
    }

    const next: SupplyState = {
      ...state,
      config: {
        businessName: config.businessName.trim(),
        centralLocation: config.centralLocation.trim(),
        outletName: config.outletName.trim(),
        currency: config.currency.trim() || "RM",
      },
    };
    saveSupplyState(next);
    setState(next);
    setConfig(next.config);
    setEditing(false);
  }

  if (!ready) {
    return (
      <main className="min-h-screen bg-[#0a0f12] p-8 text-white">
        Loading Wedge-Supply…
      </main>
    );
  }

  const configured = hasCompletedSetup(state);

  return (
    <main className="min-h-screen bg-[#0a0f12] text-[#f5efe3]">
      <header className="border-b border-white/8 bg-[#0a0f12]/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d6ad62] font-black text-[#0a0f12]">
              W
            </span>
            <div>
              <p className="font-bold text-[#f2deb8]">Wedge-Supply ERP</p>
              <p className="text-[10px] tracking-[.18em] text-white/35">
                PURCHASE · PRODUCE · DISTRIBUTE
              </p>
            </div>
          </Link>
          <Link
            href="/"
            className="rounded-full border border-white/12 px-4 py-2 text-sm text-white/65"
          >
            Wedge Works
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(75,126,116,.18),transparent_35%),radial-gradient(circle_at_20%_40%,rgba(214,173,98,.12),transparent_32%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-start gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div className="pt-3">
              <p className="text-xs font-bold tracking-[.28em] text-[#d6ad62]">
                PRACTICAL OPERATIONS ERP
              </p>
              <h1 className="mt-5 max-w-xl font-serif text-4xl leading-tight sm:text-6xl">
                One supply chain. Two simple views.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-white/58">
                Outlet teams request and receive. Central teams purchase,
                produce and distribute. Everyone works from the same record.
              </p>

              <div className="mt-9 grid max-w-xl gap-3 sm:grid-cols-3">
                {["Request clearly", "Approve safely", "Track every movement"].map(
                  (label, index) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/8 bg-white/[.035] p-4"
                    >
                      <span className="text-xs text-[#d6ad62]">0{index + 1}</span>
                      <p className="mt-2 text-sm font-semibold">{label}</p>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-[#121a1e] p-5 shadow-2xl sm:p-7">
              {editing || !configured ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold tracking-[.2em] text-[#d6ad62]">
                        FIRST-TIME SETUP
                      </p>
                      <h2 className="mt-2 text-2xl font-bold">
                        Tell us how your operation is organised.
                      </h2>
                    </div>
                    <span className="rounded-full bg-[#4b7e74]/20 px-3 py-1 text-xs text-[#a9d3ca]">
                      About 1 minute
                    </span>
                  </div>

                  <div className="mt-7 grid gap-5 sm:grid-cols-2">
                    <label className="sm:col-span-2 text-sm text-white/65">
                      Business or group name
                      <input
                        className={inputClass}
                        value={config.businessName}
                        onChange={(event) =>
                          updateConfig("businessName", event.target.value)
                        }
                        placeholder="Example: My Food Group"
                        autoComplete="organization"
                      />
                    </label>
                    <label className="text-sm text-white/65">
                      Central kitchen / warehouse name
                      <input
                        className={inputClass}
                        value={config.centralLocation}
                        onChange={(event) =>
                          updateConfig("centralLocation", event.target.value)
                        }
                        placeholder="Example: Central Kitchen HQ"
                      />
                    </label>
                    <label className="text-sm text-white/65">
                      First outlet name
                      <input
                        className={inputClass}
                        value={config.outletName}
                        onChange={(event) =>
                          updateConfig("outletName", event.target.value)
                        }
                        placeholder="Example: Ipoh Garden Outlet"
                      />
                    </label>
                    <label className="text-sm text-white/65">
                      Currency
                      <input
                        className={inputClass}
                        value={config.currency}
                        onChange={(event) =>
                          updateConfig("currency", event.target.value)
                        }
                        placeholder="RM"
                      />
                    </label>
                  </div>

                  {error && (
                    <p className="mt-5 rounded-2xl border border-red-400/30 bg-red-950/25 px-4 py-3 text-sm text-red-200">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={saveSetup}
                    className="mt-7 w-full rounded-2xl bg-[#d6ad62] px-5 py-4 text-base font-black text-[#0a0f12]"
                  >
                    Save and choose user view
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold tracking-[.2em] text-[#d6ad62]">
                        {state.config.businessName}
                      </p>
                      <h2 className="mt-2 text-2xl font-bold">
                        Who is using Wedge-Supply?
                      </h2>
                      <p className="mt-2 text-sm text-white/45">
                        Each view only shows the actions that user needs.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="rounded-full border border-white/12 px-4 py-2 text-sm text-white/65"
                    >
                      Edit setup
                    </button>
                  </div>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <a
                      href="/wedge-supply/central"
                      className="group rounded-[24px] border border-[#d6ad62]/30 bg-[#0c1215] p-6 transition hover:-translate-y-1 hover:border-[#d6ad62]"
                    >
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d6ad62] text-2xl text-[#0a0f12]">
                        ⌂
                      </span>
                      <p className="mt-5 text-xs font-bold tracking-[.18em] text-[#d6ad62]">
                        CENTRAL USER
                      </p>
                      <h3 className="mt-2 text-xl font-bold">
                        {state.config.centralLocation}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-white/50">
                        Review requests, purchase, receive stock, control
                        inventory and dispatch.
                      </p>
                      <p className="mt-5 font-bold text-[#f2deb8]">
                        Enter central operations →
                      </p>
                    </a>

                    <a
                      href="/wedge-supply/outlet"
                      className="group rounded-[24px] border border-[#4b7e74]/35 bg-[#0c1215] p-6 transition hover:-translate-y-1 hover:border-[#7fb1a7]"
                    >
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#4b7e74] text-2xl text-white">
                        ◇
                      </span>
                      <p className="mt-5 text-xs font-bold tracking-[.18em] text-[#8fc2b8]">
                        OUTLET USER
                      </p>
                      <h3 className="mt-2 text-xl font-bold">
                        {state.config.outletName}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-white/50">
                        Request supplies, follow delivery status, receive goods
                        and count outlet stock.
                      </p>
                      <p className="mt-5 font-bold text-[#b9ded7]">
                        Enter outlet operations →
                      </p>
                    </a>
                  </div>

                  <p className="mt-5 text-center text-xs text-white/30">
                    Data in this preview is saved privately in this browser.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
