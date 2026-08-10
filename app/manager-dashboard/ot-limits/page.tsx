"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type OtLimitEmployee = {
  id: string;
  employeeCode: string;
  fullName: string;
  department: string;
  monthlyCapHours: number | null;
  approvedOtHoursThisMonth: number;
  approvedOtMinutesThisMonth: number;
};

function displayHours(value: number) {
  return Number(value || 0).toFixed(2).replace(/\.00$/, "");
}

export default function ManagerOtLimitsPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<OtLimitEmployee[]>([]);
  const [month, setMonth] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const token = localStorage.getItem("wc_manager_token");
    const api = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token) {
      router.push("/manager-login");
      return;
    }
    if (!api) {
      setError("Service is not ready.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${api}/api/manager/overtime-caps`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "OT limits could not be loaded.");

      const rows = (data.employees || []) as OtLimitEmployee[];
      setEmployees(rows);
      setMonth(data.month || "");
      setDrafts(
        Object.fromEntries(
          rows.map((employee) => [
            employee.id,
            employee.monthlyCapHours == null ? "" : String(employee.monthlyCapHours),
          ]),
        ),
      );
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "OT limits could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(employee: OtLimitEmployee) {
    const token = localStorage.getItem("wc_manager_token");
    const api = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token || !api) return;

    const raw = drafts[employee.id] ?? "";
    if (raw.trim() !== "") {
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > 744) {
        setError("Monthly OT cap must be between 0 and 744 hours, or left blank for no cap.");
        return;
      }
    }

    setSavingId(employee.id);
    setMessage("");
    setError("");
    try {
      const response = await fetch(
        `${api}/api/manager/overtime-caps/${encodeURIComponent(employee.id)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            monthlyCapHours: raw.trim() === "" ? null : Number(raw),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "OT limit could not be saved.");
      setMessage(data.message || "OT limit saved.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "OT limit could not be saved.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm tracking-[0.3em] text-[#d4ad63]">WEDGECLOCKIN</p>
            <h1 className="mt-2 text-4xl font-bold text-[#f0dfbd]">Monthly OT Limits</h1>
            <p className="mt-2 max-w-3xl text-white/55">
              Set an individual approved-OT ceiling for each employee. Leave the field blank for no configured ceiling.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/manager-dashboard/attendance")}
              className="h-10 rounded-full bg-[#d4ad63] px-4 text-sm font-bold text-[#101416]"
            >
              Attendance
            </button>
            <button
              type="button"
              onClick={() => router.push("/manager-dashboard")}
              className="h-10 rounded-full border border-white/15 px-4 text-sm font-semibold text-white/70"
            >
              Dashboard
            </button>
          </div>
        </header>

        <div className="mt-6 rounded-2xl border border-[#d4ad63]/25 bg-[#1e2428] p-5 text-sm text-white/60">
          Current month: <b className="text-[#f0dfbd]">{month || "—"}</b>. The cap is enforced against total approved OT time,
          regardless of whether OT is paid or converted to replacement hours.
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            {message}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#1e2428]">
          {loading ? (
            <div className="p-8 text-white/50">Loading employee OT limits…</div>
          ) : employees.length === 0 ? (
            <div className="p-8 text-white/50">No active employees found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-white/10 text-white/45">
                  <tr>
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Approved This Month</th>
                    <th className="px-5 py-4">Monthly Cap (hours)</th>
                    <th className="px-5 py-4">Remaining</th>
                    <th className="px-5 py-4 text-center">Save</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => {
                    const raw = drafts[employee.id] ?? "";
                    const parsed = raw.trim() === "" ? null : Number(raw);
                    const remaining =
                      parsed == null || !Number.isFinite(parsed)
                        ? null
                        : Math.max(0, parsed - Number(employee.approvedOtHoursThisMonth || 0));

                    return (
                      <tr key={employee.id} className="border-b border-white/5">
                        <td className="px-5 py-4">
                          <p className="font-bold text-[#f0dfbd]">{employee.fullName}</p>
                          <p className="mt-1 text-xs text-white/40">{employee.employeeCode}</p>
                        </td>
                        <td className="px-5 py-4 text-white/60">{employee.department || "—"}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/70">
                            {displayHours(employee.approvedOtHoursThisMonth)} h
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <input
                            type="number"
                            min="0"
                            max="744"
                            step="0.25"
                            value={raw}
                            onChange={(event) =>
                              setDrafts((current) => ({ ...current, [employee.id]: event.target.value }))
                            }
                            placeholder="No cap"
                            className="h-10 w-36 rounded-xl border border-white/10 bg-[#101416] px-3 text-white outline-none focus:border-[#d4ad63]"
                          />
                        </td>
                        <td className="px-5 py-4 text-white/60">
                          {remaining == null ? "No cap" : `${displayHours(remaining)} h`}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={() => void save(employee)}
                            disabled={savingId === employee.id}
                            className="h-9 min-w-20 rounded-full bg-[#d4ad63] px-4 text-xs font-bold text-[#101416] transition hover:bg-[#e2be73] disabled:opacity-50"
                          >
                            {savingId === employee.id ? "Saving…" : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs leading-5 text-white/40">
          Example: a 6-hour cap with 5 approved hours remaining allows only 1 additional hour. If the next OT request is 2 hours,
          approval is blocked until the manager changes the employee&apos;s cap or rejects the request.
        </p>
      </section>
    </main>
  );
}
