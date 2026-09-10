"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { BusinessType } from "../engine/benchmarks";
import {
  getFreeBusinessProfile,
  saveFreeBusinessProfile,
} from "../services/freeBusinessClient";

const businessTypes: BusinessType[] = [
  "Retail",
  "F&B",
  "Beauty / Aesthetic / Medical",
  "Service",
  "Manufacturing",
  "General SME",
];

const inputClass =
  "mt-2 w-full rounded-xl border border-[#20282c]/15 bg-white px-4 py-3 outline-none focus:border-[#b4873b]";

export default function WedgeIRegisterPage() {
  const [saved, setSaved] = useState(false);
  const [profileCode, setProfileCode] = useState("");
  const [draft, setDraft] = useState({
    legalName: "",
    tradingName: "",
    businessType: "Retail" as BusinessType,
    ssmRegistrationNo: "",
    contactName: "",
    email: "",
    mobile: "",
  });

  useEffect(() => {
    const existing = getFreeBusinessProfile();
    if (!existing) return;
    setProfileCode(existing.companyCode);
    setDraft({
      legalName: existing.legalName,
      tradingName: existing.tradingName,
      businessType: existing.businessType,
      ssmRegistrationNo: existing.ssmRegistrationNo,
      contactName: existing.contactName,
      email: existing.email,
      mobile: existing.mobile,
    });
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const profile = saveFreeBusinessProfile(draft);
    setProfileCode(profile.companyCode);
    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-5 py-10 text-[#20282c]">
      <div className="mx-auto max-w-3xl">
        <Link href="/wedge-i" className="text-sm font-semibold text-[#8b692f]">← Back to Wedge-I</Link>

        <section className="mt-6 overflow-hidden rounded-[30px] border border-[#20282c]/10 bg-[#fffdf8] shadow-[0_24px_70px_rgba(32,40,44,.10)]">
          <div className="border-b border-[#20282c]/10 px-6 py-7 sm:px-9">
            <p className="text-xs font-bold tracking-[.22em] text-[#b4873b]">WEDGE-I · BUSINESS REGISTRATION</p>
            <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Register your business once.</h1>
            <p className="mt-4 max-w-2xl leading-7 text-[#657074]">
              This creates your free Wedge-I business profile on this device. You can still use Wedge-I without payment. If you later ask Wedge to manage your accounts, this business becomes the starting identity for the managed-service onboarding.
            </p>
          </div>

          <form onSubmit={submit} className="grid gap-5 p-6 sm:grid-cols-2 sm:p-9">
            <Field label="Legal / registered business name">
              <input
                className={inputClass}
                required
                value={draft.legalName}
                onChange={(e) => setDraft({ ...draft, legalName: e.target.value })}
                placeholder="Example: ABC Cafe Sdn Bhd"
              />
            </Field>

            <Field label="Trading name">
              <input
                className={inputClass}
                value={draft.tradingName}
                onChange={(e) => setDraft({ ...draft, tradingName: e.target.value })}
                placeholder="Example: ABC Cafe"
              />
            </Field>

            <Field label="Business type">
              <select
                className={inputClass}
                value={draft.businessType}
                onChange={(e) => setDraft({ ...draft, businessType: e.target.value as BusinessType })}
              >
                {businessTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>

            <Field label="SSM registration no. (optional for free use)">
              <input
                className={inputClass}
                value={draft.ssmRegistrationNo}
                onChange={(e) => setDraft({ ...draft, ssmRegistrationNo: e.target.value })}
                placeholder="Optional"
              />
            </Field>

            <Field label="Contact person">
              <input
                className={inputClass}
                required
                value={draft.contactName}
                onChange={(e) => setDraft({ ...draft, contactName: e.target.value })}
                autoComplete="name"
              />
            </Field>

            <Field label="Email">
              <input
                className={inputClass}
                required
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                autoComplete="email"
              />
            </Field>

            <Field label="Mobile number">
              <input
                className={inputClass}
                required
                type="tel"
                value={draft.mobile}
                onChange={(e) => setDraft({ ...draft, mobile: e.target.value })}
                autoComplete="tel"
                placeholder="01X-XXXXXXX"
              />
            </Field>

            <div className="rounded-2xl border border-[#b4873b]/20 bg-[#b4873b]/5 p-4 text-sm leading-6 text-[#657074]">
              <strong className="block text-[#20282c]">Free Wedge-I memory</strong>
              Up to 3 monthly snapshots stay in this browser. No receipt images or documents are stored here.
            </div>

            {saved ? (
              <div className="sm:col-span-2 rounded-2xl border border-emerald-700/15 bg-emerald-50 p-4 text-sm text-emerald-900">
                Business registered. Your Wedge-I code is <strong>{profileCode}</strong>.
              </div>
            ) : profileCode ? (
              <div className="sm:col-span-2 rounded-2xl border border-[#20282c]/10 bg-[#f7f4ec] p-4 text-sm text-[#657074]">
                Existing Wedge-I business code: <strong className="text-[#20282c]">{profileCode}</strong>
              </div>
            ) : null}

            <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-xl bg-[#20282c] px-6 py-4 font-bold text-white">
                {profileCode ? "Save Business Profile" : "Register Business"}
              </button>
              <Link href="/wedge-i" className="rounded-xl border border-[#20282c]/15 px-6 py-4 text-center font-bold">
                Continue to Wedge-I
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold">{label}{children}</label>;
}
