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
};

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
    loadAttendance();

    const timer = window.setInterval(() => {
      loadAttendance();
    }, 30000);

    return () => window.clearInterval(timer);
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
            <div className="w-full">
              <table className="w-full table-auto text-left text-sm">
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
