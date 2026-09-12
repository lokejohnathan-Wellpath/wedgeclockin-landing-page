"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ManagerLoginPage() {
  const router = useRouter();
  const [companyCode, setCompanyCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!apiBaseUrl) throw new Error("API base URL is not configured.");
      const response = await fetch(`${apiBaseUrl}/api/auth/manager-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyCode: companyCode.trim().toUpperCase(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Invalid login details.");
      localStorage.setItem("wc_manager_token", data.token);
      localStorage.setItem("wc_company_id", data.companyId);
      localStorage.setItem("wc_company_code", data.companyCode);
      localStorage.setItem("wc_company_name", data.companyName || "");
      localStorage.setItem("wc_manager_id", data.managerId || "");
      router.push("/manager-dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-[#d4ad63]/40 bg-[#1e2428] p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d4ad63] text-2xl text-black">◷</div>
            <p className="text-sm tracking-[0.3em] text-[#d4ad63]">WEDGECLOCKIN</p>
            <h1 className="mt-3 text-3xl font-bold text-[#f0dfbd]">Manager Login</h1>
            <p className="mt-3 text-sm leading-6 text-white/55">For delegated managers who operate attendance, employees, leave and payroll. Business owners should use the Client Login instead.</p>
          </div>

          <Link href="/client-login" className="mb-6 block rounded-xl border border-[#d4ad63]/35 bg-[#d4ad63]/10 px-4 py-3 text-center text-sm font-bold text-[#f0dfbd]">Business owner? Open Client Login</Link>

          <form onSubmit={handleLogin} className="space-y-5">
            <label className="block text-sm font-semibold text-white/70">Company Code
              <input type="text" value={companyCode} onChange={(event) => setCompanyCode(event.target.value)} placeholder="Enter company code" className="mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]" required />
            </label>
            <label className="block text-sm font-semibold text-white/70">Manager Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter manager password" className="mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]" required />
            </label>

            {error ? <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}

            <button type="submit" disabled={isLoading} className="block w-full rounded-full bg-[#d4ad63] px-6 py-4 text-center font-bold text-black hover:bg-[#e4bf75] disabled:cursor-not-allowed disabled:opacity-60">{isLoading ? "Logging in..." : "Manager Login"}</button>
            <div className="text-right text-xs"><Link href="/manager-forgot-password" className="text-white/55 hover:text-white">Forgot manager password?</Link></div>
          </form>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/55">Manager access is restricted to WedgeCLOCKin operations for the assigned company. It does not grant WedgeBooks, Founder Control or management P&L access.</div>
          <Link href="/" className="mt-6 block text-center text-sm text-[#d4ad63] hover:underline">Back to Wedge Works</Link>
        </div>
      </section>
    </main>
  );
}
