"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FOUNDER_TOKEN_KEY } from "../../lib/founderApi";
import {
  approveFounderBusinessRegistration,
  loadFounderBusinessRegistrations,
  rejectFounderBusinessRegistration,
  type BusinessRegistrationRequest,
} from "../../wedge-i/services/businessRegistrationClient";

export default function FounderRegistrationsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<BusinessRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<BusinessRegistrationRequest | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await loadFounderBusinessRegistrations("PENDING");
      setRows(result.registrations);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Pending registrations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(FOUNDER_TOKEN_KEY)) {
      router.replace("/founder-john-control");
      return;
    }
    void load();
  }, [load, router]);

  async function approve(row: BusinessRegistrationRequest, managed = false) {
    setBusy(true);
    setError("");
    try {
      await approveFounderBusinessRegistration(row.id, {
        managedAccounts: managed,
        books: managed,
        clockIn: managed,
      });
      setSelected(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Approval failed.");
    } finally {
      setBusy(false);
    }
  }

  async function reject(row: BusinessRegistrationRequest) {
    const reason = window.prompt("Reason for rejecting this registration?");
    if (!reason?.trim()) return;
    setBusy(true);
    setError("");
    try {
      await rejectFounderBusinessRegistration(row.id, reason.trim());
      setSelected(null);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Rejection failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#080c0f] px-5 py-8 text-[#f3efe7] sm:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/founder-john-control/dashboard" className="text-sm font-semibold text-[#d2aa62]">← Founder Dashboard</Link>
            <p className="mt-6 text-xs font-bold tracking-[.22em] text-[#d2aa62]">FOUNDER APPROVAL QUEUE</p>
            <h1 className="mt-2 font-serif text-4xl">Pending business registrations</h1>
            <p className="mt-3 text-sm text-white/45">A Wedge-I business becomes a real Wedge business only after Founder approval.</p>
          </div>
          <button onClick={() => void load()} disabled={loading} className="rounded-xl border border-white/15 px-4 py-3 text-sm font-bold">Refresh</button>
        </div>

        {error ? <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div> : null}

        <section className="mt-7 overflow-hidden rounded-2xl border border-white/8 bg-[#121a1e]">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_auto] gap-4 border-b border-white/8 px-5 py-4 text-xs font-bold uppercase tracking-[.12em] text-white/35">
            <span>Business</span><span>Contact</span><span>Submitted</span><span>Action</span>
          </div>
          {loading ? (
            <p className="p-6 text-sm text-white/45">Loading pending registrations…</p>
          ) : !rows.length ? (
            <div className="p-8 text-center">
              <p className="font-bold text-[#f1dfbc]">No pending registrations</p>
              <p className="mt-2 text-sm text-white/40">New Wedge-I business submissions will appear here.</p>
            </div>
          ) : rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1.6fr_1fr_1fr_auto] items-center gap-4 border-b border-white/6 px-5 py-4 text-sm last:border-0">
              <div>
                <b>{row.legalName}</b>
                <span className="mt-1 block text-xs text-[#d2aa62]">{row.companyCode}</span>
                <span className="mt-1 block text-xs text-white/35">{row.businessType}{row.ssmRegistrationNo ? ` · SSM ${row.ssmRegistrationNo}` : ""}</span>
              </div>
              <div>
                <span>{row.contactName}</span>
                <span className="block text-xs text-[#a8cfc9]">{row.email}</span>
                <span className="block text-xs text-white/35">{row.mobile}</span>
              </div>
              <span className="text-xs text-white/50">{new Date(row.submittedAt).toLocaleString("en-MY")}</span>
              <button onClick={() => setSelected(row)} className="rounded-lg border border-[#d2aa62]/40 px-4 py-2 text-xs font-bold">Review</button>
            </div>
          ))}
        </section>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/70 p-5 backdrop-blur-sm">
          <section className="w-full max-w-2xl rounded-[2rem] bg-[#f4efe6] p-7 text-[#20282c] shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold tracking-[.18em] text-[#9a783f]">BUSINESS REGISTRATION</p><h2 className="mt-2 font-serif text-3xl">{selected.legalName}</h2></div>
              <button onClick={() => setSelected(null)} className="rounded-full border border-[#20282c]/15 px-3 py-1 text-sm">Close</button>
            </div>
            <div className="mt-6 grid gap-3 rounded-2xl bg-white/70 p-5 text-sm sm:grid-cols-2">
              <Info label="Company code" value={selected.companyCode}/>
              <Info label="Business type" value={selected.businessType}/>
              <Info label="Contact" value={selected.contactName}/>
              <Info label="Email" value={selected.email}/>
              <Info label="Mobile" value={selected.mobile}/>
              <Info label="SSM" value={selected.ssmRegistrationNo || "Not supplied"}/>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#657074]">Approve as Wedge-I only, or approve directly as a Managed Accounts client. Managed approval enables WedgeBooks and WedgeCLOCKin under the same business identity.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button disabled={busy} onClick={() => void approve(selected, false)} className="rounded-xl border border-[#20282c]/15 px-5 py-4 font-bold">Approve Wedge-I</button>
              <button disabled={busy} onClick={() => void approve(selected, true)} className="rounded-xl bg-[#20282c] px-5 py-4 font-bold text-white">Approve + Managed Accounts</button>
            </div>
            <button disabled={busy} onClick={() => void reject(selected)} className="mt-3 w-full rounded-xl border border-red-300 bg-red-50 px-5 py-3 font-bold text-red-700">Reject registration</button>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><span className="block text-xs font-bold uppercase tracking-[.1em] text-[#8b9497]">{label}</span><b className="mt-1 block">{value}</b></div>;
}
