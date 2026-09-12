"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearManagerSession, expireManagerSession } from "../lib/managerSession";

type DashboardStats = {
  employees: number;
  present: number;
  onLeave: number;
  absent: number;
  faceRegistered: number;
  pendingFace: number;
};

const modules = [
  ["Duty Roster & OT", "Plan shifts, amend the roster and approve overtime.", "/manager-dashboard/roster"],
  ["Employees", "Maintain the employee list and workforce information.", "/manager-dashboard/employees"],
  ["Live Attendance", "Check today’s clock-in, clock-out and attendance status.", "/manager-dashboard/attendance"],
  ["Leave Approval", "Review leave requests and balances.", "/manager-dashboard/leaves"],
  ["Face Status", "Manage employee face-registration status.", "/manager-dashboard/faces"],
  ["Workplace GPS", "Review workplace location and attendance radius.", "/manager-dashboard/gps"],
] as const;

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const token = localStorage.getItem("wc_manager_token");
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!token) { router.replace("/manager-login"); return; }
      setCompanyName(localStorage.getItem("wc_company_name") || "My Business");
      setCompanyCode(localStorage.getItem("wc_company_code") || "");
      if (!apiBase) { setError("Service is not configured."); setLoading(false); return; }
      try {
        const response = await fetch(`${apiBase}/api/manager/dashboard`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (expireManagerSession(response)) return;
        if (!response.ok) throw new Error(data?.message || "Dashboard could not be loaded.");
        if (!cancelled) setStats(data.stats || null);
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "Dashboard could not be loaded.");
      } finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [router]);

  function logout() {
    clearManagerSession();
    router.replace("/manager-login");
  }

  const cards = [
    ["Employees", stats?.employees ?? "—"],
    ["Present", stats?.present ?? "—"],
    ["On Leave", stats?.onLeave ?? "—"],
    ["Absent", stats?.absent ?? "—"],
  ] as const;

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-6">
          <div><p className="text-sm tracking-[0.3em] text-[#d4ad63]">WEDGECLOCKIN · BUSINESS OPERATIONS</p><h1 className="mt-2 text-4xl font-bold text-[#f0dfbd]">{companyName || companyCode || "Company"}</h1><p className="mt-2 text-sm text-white/45">Maintain workforce operations. Wedge handles bookkeeping, reconciliation and management reporting separately.</p></div>
          <div className="flex flex-wrap gap-2"><Link href="/business" className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white/65">Business Home</Link><button onClick={logout} className="rounded-full border border-[#d4ad63]/45 px-5 py-3 text-sm font-bold text-[#f0dfbd]">Logout</button></div>
        </header>

        {error ? <div className="mt-6 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">{error}</div> : null}
        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([label,value]) => <div key={label} className="rounded-2xl border border-white/10 bg-[#1e2428] p-5"><p className="text-xs uppercase tracking-[.14em] text-white/35">{label}</p><p className="mt-2 text-3xl font-bold text-[#f0dfbd]">{loading ? "…" : value}</p></div>)}</section>

        <section className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{modules.map(([title,text,href]) => <Link key={title} href={href} className="rounded-[24px] border border-[#d4ad63]/20 bg-[#1e2428] p-6 transition hover:border-[#d4ad63]/55"><h2 className="text-xl font-bold text-[#f0dfbd]">{title}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-white/45">{text}</p><span className="mt-5 inline-flex text-sm font-bold text-[#d4ad63]">Open →</span></Link>)}</section>

        <section className="mt-7 rounded-[28px] border border-[#d4ad63]/30 bg-[#1e2428] p-6 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold tracking-[.18em] text-[#d4ad63]">SEND DOCUMENTS TO WEDGE</p><h2 className="mt-2 text-2xl font-bold text-[#f0dfbd]">Receipt / invoice capture</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Photograph or upload source documents. They go straight into the WedgeBooks review inbox; you do not need to select accounting categories.</p></div><Link href="/business/capture" className="shrink-0 rounded-full bg-[#d4ad63] px-6 py-3 font-bold text-[#101416]">Scan Document</Link></div></section>

        <p className="mt-7 text-center text-xs leading-5 text-white/30">Month-end payroll is generated automatically from workforce records for Wedge review. Wedge-I, full WedgeBooks, reconciliation and P&amp;L are internal Wedge tools.</p>
      </section>
    </main>
  );
}
