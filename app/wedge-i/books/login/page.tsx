"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { productRequest, saveProductToken } from "../../../lib/productAccess";

export default function WedgeBooksLogin() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await productRequest<{ token: string }>(
        "books",
        "/api/saas/auth/login",
        {
          method: "POST",
          body: JSON.stringify({
            product: "books",
            email: form.get("email"),
            password: form.get("password"),
          }),
        },
        false,
      );
      saveProductToken("books", result.token);
      router.push("/wedge-i/books");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(210,170,98,.18),transparent_30%),#f3efe7] px-5 py-10 text-[#20282c]">
      <div className="mx-auto max-w-lg">
        <Link href="/wedge-i" className="mb-8 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#20282c] font-black text-[#f1dfbc]">W</span>
          <b>WedgeBooks</b>
        </Link>
        <section className="rounded-[28px] border border-[#20282c]/10 bg-white p-6 shadow-[0_24px_70px_rgba(32,40,44,.12)] sm:p-9">
          <p className="text-xs font-bold tracking-[.22em] text-[#b08745]">AI BOOKKEEPING</p>
          <h1 className="mt-3 font-serif text-4xl">WedgeBooks Login</h1>
          <p className="mt-3 text-sm leading-6 text-[#657074]">
            WedgeBooks access is activated by Wedge after Founder approval. Use the approved business owner credentials supplied for your account.
          </p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-sm font-semibold">Email address
              <input name="email" required type="email" autoComplete="email" className="mt-2 w-full rounded-xl border border-[#20282c]/15 bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#5e8983]" />
            </label>
            <label className="block text-sm font-semibold">Password
              <input name="password" required type="password" autoComplete="current-password" className="mt-2 w-full rounded-xl border border-[#20282c]/15 bg-[#fbfaf7] px-4 py-3 outline-none focus:border-[#5e8983]" />
            </label>
            <div className="text-right"><Link href="/wedge-i/books/forgot-password" className="text-xs font-bold text-[#497973]">Forgot password?</Link></div>
            <button disabled={busy} className="w-full rounded-xl bg-[#20282c] px-5 py-4 font-bold text-white disabled:opacity-60">{busy ? "Please wait..." : "Login"}</button>
            {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
          </form>
          <div className="mt-6 rounded-xl border border-[#b08745]/20 bg-[#f8f3ea] p-4 text-sm leading-6 text-[#657074]">
            New business? <Link href="/wedge-i/register" className="font-bold text-[#497973]">Register in Wedge-I</Link>. WedgeBooks is enabled only after Founder approval.
          </div>
        </section>
      </div>
    </main>
  );
}
