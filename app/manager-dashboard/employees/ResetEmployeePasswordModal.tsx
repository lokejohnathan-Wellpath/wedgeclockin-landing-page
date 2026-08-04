"use client";

import { useState } from "react";

type Employee = { id: string; fullName: string; employeeCode: string };

export default function ResetEmployeePasswordModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function resetPassword() {
    if (!window.confirm(`Reset the login password for ${employee.fullName}? Existing employee sessions will be ended.`)) return;
    const token = localStorage.getItem("wc_manager_token");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token || !apiBaseUrl) {
      setError("Manager session has expired.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/manager/employees/${encodeURIComponent(employee.id)}/reset-password`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Password could not be reset.");
      setTemporaryPassword(data.temporaryPassword || "");
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Password could not be reset.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(temporaryPassword);
    setCopied(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <section className="w-full max-w-xl rounded-[2rem] border border-[#d4ad63]/35 bg-[#171d20] p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-[#d4ad63]">EMPLOYEE LOGIN SECURITY</p>
            <h2 className="mt-2 text-2xl font-bold text-[#f0dfbd]">Reset Login Password</h2>
            <p className="mt-2 text-sm text-white/50">{employee.fullName} · {employee.employeeCode}</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/60">Close</button>
        </div>

        {!temporaryPassword ? (
          <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
            <p className="text-sm leading-6 text-white/65">
              The system will generate a one-time temporary password, end earlier employee sessions and require a new password at the next login.
            </p>
            {error && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            <button onClick={resetPassword} disabled={loading} className="mt-5 w-full rounded-xl bg-[#d4ad63] px-5 py-3 font-bold text-[#101416] disabled:opacity-50">
              {loading ? "Generating…" : "Generate Temporary Password"}
            </button>
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-5">
            <p className="text-sm font-semibold text-emerald-100">Temporary password — shown once</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <code className="min-w-0 flex-1 overflow-x-auto rounded-xl bg-black/35 px-4 py-3 text-lg text-[#f0dfbd]">{temporaryPassword}</code>
              <button onClick={copyPassword} className="rounded-xl border border-emerald-400/35 px-5 py-3 font-semibold text-emerald-100">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-4 text-xs leading-5 text-white/45">Give it directly to the employee. WedgeCLOCKin cannot display it again after this window closes.</p>
          </div>
        )}
      </section>
    </div>
  );
}
