"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { loginOwner, type OwnerSelectionRequired } from "../lib/ownerAccess";

const inputClass = "mt-2 w-full rounded-xl border border-[#20282c]/15 bg-white px-4 py-3 outline-none focus:border-[#b4873b]";

export default function ClientLoginPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selection, setSelection] = useState<OwnerSelectionRequired["businesses"]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await loginOwner(email.trim(), password);
      if ("code" in result && result.code === "BUSINESS_SELECTION_REQUIRED") {
        setSelection(result.businesses);
        return;
      }
      router.push("/client-dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function selectBusiness(businessId: string) {
    setBusy(true);
    setError("");
    try {
      const result = await loginOwner(email.trim(), password, businessId);
      if ("token" in result) router.push("/client-dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Business could not be opened.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f1e8] px-5 py-10 text-[#20282c]">
      <section className="w-full max-w-lg rounded-[30px] border border-[#20282c]/10 bg-[#fffdf8] p-7 shadow-[0_24px_70px_rgba(32,40,44,.10)] sm:p-9">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[#20282c] font-black text-[#efd9ae]">W</span>
          <div>
            <p className="font-bold">Wedge Client Access</p>
            <p className="text-[10px] tracking-[.16em] text-[#7a8385]">ONE LOGIN · ONE BUSINESS IDENTITY</p>
          </div>
        </div>

        <h1 className="mt-8 font-serif text-4xl">Business owner login</h1>
        <p className="mt-3 text-sm leading-6 text-[#657074]">Use the email and password created after Founder approval. This one login opens your Wedge-I, WedgeBooks, WedgeCLOCKin and reviewed management reports according to your enabled services.</p>

        {!selection.length ? (
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-sm font-semibold">Owner email
              <input value={email} onChange={(event) => setEmail(event.target.value)} name="email" required type="email" autoComplete="email" className={inputClass} />
            </label>
            <label className="block text-sm font-semibold">Password
              <input value={password} onChange={(event) => setPassword(event.target.value)} name="password" required type="password" autoComplete="current-password" className={inputClass} />
            </label>
            <div className="text-right"><Link href="/client-forgot-password" className="text-xs font-bold text-[#8b692f]">Forgot password?</Link></div>
            <button disabled={busy} className="w-full rounded-xl bg-[#20282c] px-5 py-4 font-bold text-white disabled:opacity-50">{busy ? "Opening…" : "Open Client Dashboard"}</button>
          </form>
        ) : (
          <div className="mt-7 space-y-3">
            <p className="text-sm font-semibold">Choose the business you want to open:</p>
            {selection.map((business) => (
              <button key={business.businessId} disabled={busy} onClick={() => void selectBusiness(business.businessId)} className="w-full rounded-2xl border border-[#20282c]/12 bg-white p-4 text-left hover:border-[#b4873b] disabled:opacity-50">
                <span className="block font-bold">{business.name}</span>
                <span className="mt-1 block text-xs text-[#657074]">{business.companyCode}</span>
              </button>
            ))}
            <button onClick={() => setSelection([])} className="w-full py-2 text-sm font-semibold text-[#8b692f]">Back to login</button>
          </div>
        )}

        {error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <div className="mt-7 border-t border-[#20282c]/10 pt-5 text-center text-xs text-[#657074]">
          Not approved yet? <Link href="/wedge-i" className="font-bold text-[#8b692f]">Open free Wedge-I</Link>
        </div>
      </section>
    </main>
  );
}
