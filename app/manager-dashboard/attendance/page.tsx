"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type AttendanceRow = {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  faceRegistered: boolean;
  clockIn: string | null;
  restOut: string | null;
  restIn: string | null;
  clockOut: string | null;
  rosterEnabled?: boolean;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  lateMinutes?: number;
  overtimeMinutes?: number;
  overtimeStatus?: "none" | "pending" | "approved" | "rejected";
  gpsStatus: string;
  todayStatus: string;
  attendanceSource?: "none" | "employee-face-gps" | "manager-entered" | "manager-corrected" | "manager-voided";
  voidedAt?: string | null;
};

function malaysiaDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function malaysiaLocalInput(value: string | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

function formatMalaysiaTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function badge(text: string) {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs leading-none";

  if (text === "Working" || text === "Registered" || text === "Recorded") {
    return `${base} border border-green-400/30 bg-green-500/10 text-green-200`;
  }

  if (text === "On Rest" || text === "Pending") {
    return `${base} border border-yellow-400/30 bg-yellow-500/10 text-yellow-200`;
  }

  if (text === "Late" || text === "Rejected") {
    return `${base} border border-red-400/30 bg-red-500/10 text-red-200`;
  }

  if (text === "Approved") {
    return `${base} border border-emerald-400/30 bg-emerald-500/10 text-emerald-200`;
  }

  if (text === "Clocked Out") {
    return `${base} border border-blue-400/30 bg-blue-500/10 text-blue-200`;
  }

  if (text === "Approved Leave" || text === "On Leave") {
    return `${base} border border-purple-400/30 bg-purple-500/10 text-purple-200`;
  }

  if (text === "Absent") {
    return `${base} border border-red-400/30 bg-red-500/10 text-red-200`;
  }

  return `${base} border border-white/10 bg-white/5 text-white/60`;
}

export default function ManagerAttendancePage() {
  const router = useRouter();

  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");
  const [error, setError] = useState("");
  const [editingRow, setEditingRow] = useState<AttendanceRow | null>(null);
  const [clockIn, setClockIn] = useState("");
  const [restOut, setRestOut] = useState("");
  const [restIn, setRestIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [savingCorrection, setSavingCorrection] = useState(false);

  const loadAttendance = useCallback(async () => {
    const token = localStorage.getItem("wc_manager_token");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!token) {
      router.push("/manager-login");
      return;
    }

    if (!apiBaseUrl) {
      setError("Service is not ready. Please try again later.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/manager/attendance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error();
      }

      setRows(data.attendance || []);
      setLastUpdated(
        new Intl.DateTimeFormat("en-MY", {
          timeZone: "Asia/Kuala_Lumpur",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }).format(new Date())
      );
      setError("");
    } catch {
      setError("Attendance could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadAttendance();
    }, 0);

    const timer = window.setInterval(() => {
      void loadAttendance();
    }, 30000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(timer);
    };
  }, [loadAttendance]);

  const summary = useMemo(() => {
    return {
      total: rows.length,
      working: rows.filter((row) => row.todayStatus === "Working").length,
      rest: rows.filter((row) => row.todayStatus === "On Rest").length,
      leave: rows.filter(
        (row) =>
          row.todayStatus === "On Leave" ||
          row.todayStatus === "Approved Leave"
      ).length,
      absent: rows.filter((row) => row.todayStatus === "Absent").length,
    };
  }, [rows]);

  function openCorrection(row: AttendanceRow) {
    setEditingRow(row);
    setClockIn(malaysiaLocalInput(row.clockIn));
    setRestOut(malaysiaLocalInput(row.restOut));
    setRestIn(malaysiaLocalInput(row.restIn));
    setClockOut(malaysiaLocalInput(row.clockOut));
    setCorrectionReason("");
    setError("");
  }

  async function saveCorrection() {
    if (!editingRow) return;
    const token = localStorage.getItem("wc_manager_token");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token || !apiBaseUrl) return;
    setSavingCorrection(true);
    setError("");
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/manager/attendance/${encodeURIComponent(editingRow.employeeId)}`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ dateKey: malaysiaDateKey(), clockIn, restOut, restIn, clockOut, reason: correctionReason }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Attendance correction could not be saved.");
      setEditingRow(null);
      await loadAttendance();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Attendance correction could not be saved.");
    } finally {
      setSavingCorrection(false);
    }
  }

  async function voidAttendance() {
    if (!editingRow || !editingRow.clockIn) return;
    if (!window.confirm(`Delete today's attendance for ${editingRow.employeeName}? It will disappear from attendance and payroll, while a protected audit record is retained.`)) return;
    const token = localStorage.getItem("wc_manager_token");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token || !apiBaseUrl) return;
    setSavingCorrection(true);
    setError("");
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/manager/attendance/${encodeURIComponent(editingRow.employeeId)}/void`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ dateKey: malaysiaDateKey(), reason: correctionReason }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Attendance could not be deleted.");
      setEditingRow(null);
      await loadAttendance();
    } catch (voidError) {
      setError(voidError instanceof Error ? voidError.message : "Attendance could not be deleted.");
    } finally {
      setSavingCorrection(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm tracking-[0.35em] text-[#d4ad63]">
              WEDGECLOCKIN
            </p>
            <h1 className="mt-2 text-4xl font-bold text-[#f0dfbd]">
              Live Attendance
            </h1>
            <p className="mt-2 text-white/55">
              View today&apos;s face clock-in, rest and clock-out status.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={loadAttendance}
              className="rounded-full border border-[#d4ad63]/50 px-6 py-3 font-semibold text-[#f0dfbd] hover:bg-white/5"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() => router.push("/manager-dashboard")}
              className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white/70 hover:bg-white/5"
            >
              Back
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#d4ad63]/30 bg-[#1e2428] p-5 text-sm text-white/60">
          {loading
            ? "Loading attendance..."
            : error
              ? error
              : `Attendance updated${lastUpdated ? ` at ${lastUpdated}` : ""}.`}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-5">
          <div className="rounded-2xl border border-[#d4ad63]/25 bg-white/5 p-5">
            <p className="text-sm text-white/45">Employees</p>
            <p className="mt-2 text-3xl font-bold text-[#d4ad63]">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-green-400/20 bg-green-500/5 p-5">
            <p className="text-sm text-white/45">Working</p>
            <p className="mt-2 text-3xl font-bold text-green-200">
              {summary.working}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/5 p-5">
            <p className="text-sm text-white/45">On Rest</p>
            <p className="mt-2 text-3xl font-bold text-yellow-200">
              {summary.rest}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-400/20 bg-purple-500/5 p-5">
            <p className="text-sm text-white/45">On Leave</p>
            <p className="mt-2 text-3xl font-bold text-purple-200">
              {summary.leave}
            </p>
          </div>

          <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-5">
            <p className="text-sm text-white/45">Absent</p>
            <p className="mt-2 text-3xl font-bold text-red-200">
              {summary.absent}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1e2428]">
          {rows.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold text-[#f0dfbd]">
                No attendance records yet
              </p>
              <p className="mt-3 text-sm text-white/50">
                Today&apos;s face clock-in records will appear here.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1280px] table-auto text-left text-sm">
                <thead className="border-b border-white/10 text-white/45">
                  <tr>
                    <th className="px-3 py-4">Employee</th>
                    <th className="px-3 py-4">Department</th>
                    <th className="px-3 py-4">Face</th>
                    <th className="px-3 py-4 whitespace-nowrap">Clock In</th>
                    <th className="px-3 py-4 whitespace-nowrap">Rest Out</th>
                    <th className="px-3 py-4 whitespace-nowrap">Rest In</th>
                    <th className="px-3 py-4 whitespace-nowrap">Clock Out</th>
                    <th className="px-3 py-4">GPS</th>
                    <th className="px-3 py-4">Roster / Late</th>
                    <th className="px-3 py-4">OT</th>
                    <th className="px-3 py-4">Status</th>
                    <th className="px-3 py-4">Source</th>
                    <th className="sticky right-0 z-10 bg-[#1e2428] px-3 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((row) => (
                    <tr key={row.employeeId} className="border-b border-white/5">
                      <td className="px-3 py-4 align-middle">
                        <p className="font-semibold text-[#f0dfbd]">
                          {row.employeeName}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                          {row.employeeCode}
                        </p>
                      </td>
                      <td className="px-3 py-4 align-middle text-white/60">
                        {row.department || "—"}
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <span
                          className={badge(
                            row.faceRegistered ? "Registered" : "Pending"
                          )}
                        >
                          {row.faceRegistered ? "Registered" : "Pending"}
                        </span>
                      </td>

                      <td className="px-3 py-4 align-middle whitespace-nowrap text-white/60">
                        {formatMalaysiaTime(row.clockIn)}
                      </td>

                      <td className="px-3 py-4 align-middle whitespace-nowrap text-white/60">
                        {formatMalaysiaTime(row.restOut)}
                      </td>

                      <td className="px-3 py-4 align-middle whitespace-nowrap text-white/60">
                        {formatMalaysiaTime(row.restIn)}
                      </td>

                      <td className="px-3 py-4 align-middle whitespace-nowrap text-white/60">
                        {formatMalaysiaTime(row.clockOut)}
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <span className={badge(row.gpsStatus)}>
                          {row.gpsStatus}
                        </span>
                      </td>

                      <td className="px-3 py-4 align-middle">
                        {!row.rosterEnabled ? (
                          <span className={badge("Optional")}>Not used</span>
                        ) : (row.lateMinutes || 0) > 0 ? (
                          <div>
                            <span className={badge("Late")}>Late</span>
                            <p className="mt-1 whitespace-nowrap text-xs text-red-200/70">
                              {row.lateMinutes} min · start {formatMalaysiaTime(row.scheduledStart || null)}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <span className={badge("Recorded")}>On time</span>
                            <p className="mt-1 whitespace-nowrap text-xs text-white/35">
                              start {formatMalaysiaTime(row.scheduledStart || null)}
                            </p>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4 align-middle">
                        {(row.overtimeMinutes || 0) > 0 ? (
                          <div>
                            <span
                              className={badge(
                                row.overtimeStatus === "approved"
                                  ? "Approved"
                                  : row.overtimeStatus === "rejected"
                                    ? "Rejected"
                                    : "Pending"
                              )}
                            >
                              {row.overtimeStatus === "approved"
                                ? "Approved"
                                : row.overtimeStatus === "rejected"
                                  ? "Rejected"
                                  : "Pending"}
                            </span>
                            <p className="mt-1 whitespace-nowrap text-xs text-white/40">
                              {row.overtimeMinutes} min
                            </p>
                          </div>
                        ) : (
                          <span className="text-white/35">—</span>
                        )}
                      </td>

                      <td className="px-3 py-4 align-middle">
                        <span className={badge(row.todayStatus)}>
                          {row.todayStatus}
                        </span>
                      </td>

                      <td className="px-3 py-4 align-middle whitespace-nowrap text-xs text-white/50">
                        {row.attendanceSource === "employee-face-gps"
                          ? "Face / GPS"
                          : row.attendanceSource === "manager-entered"
                            ? "Manager entered"
                            : row.attendanceSource === "manager-corrected"
                              ? "Manager corrected"
                              : row.attendanceSource === "manager-voided"
                                ? "Deleted"
                                : "—"}
                      </td>

                      <td className="sticky right-0 bg-[#1e2428] px-3 py-4 align-middle shadow-[-12px_0_18px_-16px_rgba(0,0,0,0.95)]">
                        <button
                          type="button"
                          onClick={() => openCorrection(row)}
                          aria-label={`Manage attendance for ${row.employeeName}`}
                          title={row.clockIn ? "Edit or delete attendance" : "Add missing attendance"}
                          className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[#d4ad63]/45 px-3.5 py-2 text-xs font-semibold text-[#e5c584] transition hover:bg-[#d4ad63]/10 focus:outline-none focus:ring-2 focus:ring-[#d4ad63]/40"
                        >
                          <AttendanceActionIcon hasAttendance={Boolean(row.clockIn)} />
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
          <section className="my-6 w-full max-w-3xl rounded-[2rem] border border-[#d4ad63]/35 bg-[#171d20] p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.28em] text-[#d4ad63]">{editingRow.clockIn ? "MANAGE ATTENDANCE" : "ADD MISSING PUNCH"} · {malaysiaDateKey()}</p>
                <h2 className="mt-2 text-2xl font-bold text-[#f0dfbd]">{editingRow.employeeName}</h2>
                <p className="mt-1 text-sm text-white/45">{editingRow.employeeCode}</p>
              </div>
              <button onClick={() => { setEditingRow(null); setError(""); }} className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/60">Close</button>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <AttendanceInput label="Clock In" value={clockIn} onChange={setClockIn} />
              <AttendanceInput label="Rest Out" value={restOut} onChange={setRestOut} />
              <AttendanceInput label="Rest In" value={restIn} onChange={setRestIn} />
              <AttendanceInput label="Clock Out" value={clockOut} onChange={setClockOut} />
            </div>
            <label className="mt-5 block text-sm font-semibold text-[#f0dfbd]">
              Required reason
              <textarea value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} placeholder="Example: employee could not punch in because the internet line was unavailable" className="mt-2 min-h-24 w-full rounded-xl border border-white/10 bg-[#0f1315] px-4 py-3 font-normal text-white outline-none focus:border-[#d4ad63]" />
            </label>
            <p className="mt-3 text-xs leading-5 text-white/40">The original values, corrected values, manager identity, reason and timestamp are retained. Draft payroll attendance totals refresh automatically.</p>
            {error && <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              {editingRow.clockIn && <button onClick={voidAttendance} disabled={savingCorrection || correctionReason.trim().length < 4} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/35 px-5 py-3 font-semibold text-red-200 disabled:opacity-40"><TrashIcon />Delete Attendance</button>}
              <button onClick={saveCorrection} disabled={savingCorrection || correctionReason.trim().length < 4 || !clockIn} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4ad63] px-6 py-3 font-bold text-[#101416] disabled:opacity-40"><SaveIcon />{savingCorrection ? "Saving…" : editingRow.clockIn ? "Save Changes" : "Save Missing Punch"}</button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function AttendanceActionIcon({ hasAttendance }: { hasAttendance: boolean }) {
  return hasAttendance ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="m16.9 3.8 3.3 3.3M4 20l4.1-.8L19.4 7.9a2.3 2.3 0 0 0-3.3-3.3L4.8 15.9 4 20Z" />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8">
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13M10 11v5m4-5v5" /></svg>;
}

function SaveIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M5 4h12l2 2v14H5V4Zm3 0v6h8V4m-8 16v-6h8v6" /></svg>;
}

function AttendanceInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold text-[#f0dfbd]">
      {label}
      <input type="datetime-local" value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1315] px-4 py-3 font-normal text-white outline-none focus:border-[#d4ad63]" />
    </label>
  );
}
