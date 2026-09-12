"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function BusinessOperationsPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("My Business");
  const [companyCode, setCompanyCode] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("wc_manager_token")) {
      router.replace("/manager-login");
      return;
    }
    setCompanyName(localStorage.getItem("wc_company_name") || "My Business");
    setCompanyCode(localStorage.getItem("wc_company_code") || "");
  }, [router]);

  function logout() {
    for (const key of ["wc_manager_token", "wc_company_id", "wc_company_code", "wc_company_name", "wc_manager_id"]) localStorage.removeItem(key);
    router.replace("/manager-login");
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8] px-5 py-8 text-[#20282c] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#20282c]/10 pb-6">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#20282c] font-black text-[#efd9ae]">W</span><div><p className="font-black tracking-[.12em]">WEDGE BUSINESS</p><p className="text-xs text-[#667074]">Operations · {companyCode || "WedgeCLOCKin"}</p></div></div>
          <button onClick={logout} className="rounded-full border border-[#20282c]/15 px-4 py-2 text-xs font-bold">Log out</button>
        </header>

        <section className="mt-8 rounded-[30px] border border-[#d8d0c2] bg-white p-7 shadow-[0_24px_70px_rgba(32,40,44,.07)] sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#9b7639]">YOUR BUSINESS TOOLS</p>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">{companyName}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667074]">Keep operations current and send source documents to Wedge. Bookkeeping, reconciliation, Wedge-I and management P&amp;L are handled by the Wedge back-office team.</p>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <Link href="/manager-dashboard" className="rounded-[28px] border border-[#d8d0c2] bg-white p-7 shadow-[0_18px_50px_rgba(32,40,44,.05)]">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9b7639]">WEDGECLOCKIN</p>
            <h2 className="mt-3 text-3xl font-bold">Staff &amp; roster</h2>
            <p className="mt-3 text-sm leading-6 text-[#667074]">Maintain employees, roster, attendance, leave and approved overtime. Month-end payroll flows into Wedge&apos;s accounting process.</p>
            <span className="mt-6 inline-flex rounded-full bg-[#20282c] px-5 py-3 text-sm font-bold text-white">Open WedgeCLOCKin →</span>
          </Link>

          <Link href="/business/capture" className="rounded-[28px] border border-[#d8d0c2] bg-[#fffdf8] p-7 shadow-[0_18px_50px_rgba(32,40,44,.05)]">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#9b7639]">WEDGEBOOKS CAPTURE</p>
            <h2 className="mt-3 text-3xl font-bold">Scan documents</h2>
            <p className="mt-3 text-sm leading-6 text-[#667074]">Take a photo or upload a receipt, invoice or bill. Wedge reads what it can and sends it to the bookkeeping review inbox.</p>
            <span className="mt-6 inline-flex rounded-full bg-[#b99152] px-5 py-3 text-sm font-bold text-white">Scan / Upload →</span>
          </Link>
        </section>

        <section className="mt-6 rounded-[24px] border border-[#d8d0c2] bg-white p-6 text-sm leading-6 text-[#667074]">
          <b className="text-[#20282c]">Month end:</b> send your sales report and bank statement to the Wedge team. Wedge reconciles them against the books and payroll, follows up missing items and prepares the monthly management report.
        </section>
      </div>
    </main>
  );
}
