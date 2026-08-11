"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  clearManagerSession,
  expireManagerSession,
} from "../lib/managerSession";

type DashboardStats = {
  employees: number;
  present: number;
  onLeave: number;
  absent: number;
  faceRegistered: number;
  pendingFace: number;
};

type AttendanceRecord = {
  id?: string;
  employeeId: string;
  employeeName: string;
  clockIn: string | null;
  restOut: string | null;
  restIn: string | null;
  clockOut: string | null;
  lateMinutes?: number;
  todayStatus?: string;
  rosterEnabled?: boolean;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
};

type LeaveItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
};

type ModuleCard = {
  title: string;
  text: string;
  href: string;
};

const modules: ModuleCard[] = [
  {
    title: "Live Attendance",
    text: "View today’s clock in, rest, clock out, face and GPS status.",
    href: "/manager-dashboard/attendance",
  },
  {
    title: "Face Status",
    text: "Check registered and pending employee face setup.",
    href: "/manager-dashboard/faces",
  },
  {
    title: "Employee Management",
    text: "View and manage company employees.",
    href: "/manager-dashboard/employees",
  },
  {
    title: "Leave Approval",
    text: "Review pending leave and employee balances.",
    href: "/manager-dashboard/leaves",
  },
  {
    title: "Payroll",
    text: "Review salary records and monthly payroll.",
    href: "/manager-dashboard/payroll",
  },
  {
    title: "Payslip",
    text: "View employee payslip records and history.",
    href: "/manager-dashboard/payslips",
  },
  {
    title: "CSV / Excel Export",
    text: "Export attendance, employee, leave and payroll records.",
    href: "/manager-dashboard/export",
  },
  {
    title: "Workplace GPS",
    text: "Review workplace location and attendance radius.",
    href: "/manager-dashboard/gps",
  },
  {
    title: "Duty Roster & OT",
    text: "Plan optional weekly shifts, detect lateness and approve overtime.",
    href: "/manager-dashboard/roster",
  },
  {
    title: "Employment Intelligence",
    text: "Prepare employee letters, Word/PDF copies and probation decisions.",
    href: "/manager-dashboard/employment",
  },
];

// WEDGE_V412_LIVE_STATUS: manager dashboard shows real-time leave, absence and late warnings.
function malaysiaDateKey(value: Date | string = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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

export default function ManagerDashboardPage() {
  const router = useRouter();

  const [companyCode, setCompanyCode] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const token = localStorage.getItem("wc_manager_token");
      const storedCompanyCode = localStorage.getItem("wc_company_code");
      const storedCompanyName = localStorage.getItem("wc_company_name");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!token) {
        router.push("/manager-login");
        return;
      }

      setCompanyCode(storedCompanyCode || "");
      setCompanyName(storedCompanyName || "");

      if (!apiBaseUrl) {
        setError("Service is not ready. Please try again later.");
        setIsLoading(false);
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [dashboardResponse, attendanceResponse, leaveResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/manager/dashboard`, { headers, cache: "no-store" }),
          fetch(`${apiBaseUrl}/api/manager/attendance`, { headers, cache: "no-store" }),
          fetch(`${apiBaseUrl}/api/manager/leaves`, { headers, cache: "no-store" }),
        ]);

        const [dashboardData, attendanceData, leaveData] = await Promise.all([
          dashboardResponse.json(),
          attendanceResponse.json(),
          leaveResponse.json(),
        ]);

        if (expireManagerSession(dashboardResponse)) return;

        if (!dashboardResponse.ok || !attendanceResponse.ok || !leaveResponse.ok) {
          throw new Error(dashboardData?.message || "Dashboard could not be loaded.");
        }

        setStats(dashboardData.stats);
        setAttendance(attendanceData.attendance || []);
        setLeaves(leaveData.leaves || []);
      } catch {
        setError("Dashboard could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
    const refreshTimer = window.setInterval(() => {
      void loadDashboard();
    }, 30000);

    return () => window.clearInterval(refreshTimer);
  }, [router]);

  function handleLogout() {
    clearManagerSession();
    router.push("/manager-login");
  }

  function openExecutiveWorkspace() {
    router.push("/wedge-i");
  }

  const companyDisplayName = companyName || companyCode || "Company";
  const todayKey = malaysiaDateKey();

  const approvedLeaveByEmployee = useMemo(() => {
    const map = new Map<string, LeaveItem>();
    for (const leave of leaves) {
      if (String(leave.status || "").toLowerCase() !== "approved") continue;
      const start = malaysiaDateKey(leave.startDate);
      const end = malaysiaDateKey(leave.endDate);
      if (!start || !end || todayKey < start || todayKey > end) continue;
      if (!map.has(leave.employeeId)) map.set(leave.employeeId, leave);
    }
    return map;
  }, [leaves, todayKey]);

  const liveStats = useMemo(() => {
    const present = attendance.filter((row) => Boolean(row.clockIn)).length;
    const onLeave = attendance.filter(
      (row) =>
        !row.clockIn &&
        (approvedLeaveByEmployee.has(row.employeeId) ||
          row.todayStatus === "On Leave" ||
          row.todayStatus === "Approved Leave"),
    ).length;
    const absent = attendance.filter((row) => {
      if (row.clockIn || approvedLeaveByEmployee.has(row.employeeId)) return false;
      if (row.todayStatus === "Absent") return true;
      if (!row.scheduledStart) return false;
      const scheduledStartMs = new Date(row.scheduledStart).getTime();
      return Number.isFinite(scheduledStartMs) && Date.now() >= scheduledStartMs;
    }).length;

    return {
      employees: stats?.employees ?? attendance.length,
      present,
      onLeave,
      absent,
      faceRegistered: stats?.faceRegistered ?? "—",
      pendingFace: stats?.pendingFace ?? "—",
    };
  }, [attendance, approvedLeaveByEmployee, stats]);

  const statCards = [
    { label: "Employees", value: liveStats.employees, href: "/manager-dashboard/employees" },
    { label: "Present", value: liveStats.present, href: "/manager-dashboard/attendance" },
    { label: "On Leave", value: liveStats.onLeave, href: "/manager-dashboard/leaves", pulse: liveStats.onLeave > 0 },
    { label: "Absent", value: liveStats.absent, href: "/manager-dashboard/attendance", pulse: liveStats.absent > 0 },
    { label: "Face Registered", value: liveStats.faceRegistered, href: "/manager-dashboard/faces" },
    { label: "Pending Face", value: liveStats.pendingFace, href: "/manager-dashboard/faces" },
  ];

  // WEDGE_V4122_ROSTER_FALLBACK:
  // Use the saved attendance lateMinutes first, but derive it from roster timestamps
  // when an older attendance row was created before the roster was saved/attached.
  function derivedLateMinutes(record: AttendanceRecord) {
    const stored = Math.max(0, Math.floor(Number(record.lateMinutes || 0)));
    if (stored > 0) return stored;
    if (!record.clockIn || !record.scheduledStart) return 0;

    const clockInMs = new Date(record.clockIn).getTime();
    const scheduledStartMs = new Date(record.scheduledStart).getTime();
    if (!Number.isFinite(clockInMs) || !Number.isFinite(scheduledStartMs)) return 0;

    return Math.max(0, Math.floor((clockInMs - scheduledStartMs) / 60000));
  }

  function isAutomaticallyAbsent(record: AttendanceRecord) {
    if (record.clockIn || approvedLeaveByEmployee.has(record.employeeId)) return false;
    if (record.todayStatus === "Absent") return true;
    if (!record.scheduledStart) return false;

    const scheduledStartMs = new Date(record.scheduledStart).getTime();
    if (!Number.isFinite(scheduledStartMs)) return false;

    return Date.now() >= scheduledStartMs;
  }

  function liveStatus(record: AttendanceRecord) {
    const approvedLeave = approvedLeaveByEmployee.get(record.employeeId);
    if (!record.clockIn && approvedLeave) {
      return {
        text: approvedLeave.leaveType || "Approved Leave",
        className: "animate-pulse border-purple-400/50 bg-purple-500/15 text-purple-100",
      };
    }

    const lateMinutes = derivedLateMinutes(record);
    if (record.clockIn && lateMinutes > 0) {
      return {
        text: `LATE • ${lateMinutes} min`,
        className: "animate-pulse border-red-400/60 bg-red-500/15 text-red-100",
      };
    }

    if (isAutomaticallyAbsent(record)) {
      return {
        text: "ABSENT",
        className: "animate-pulse border-red-400/50 bg-red-500/10 text-red-200",
      };
    }

    if (!record.clockIn) {
      return {
        text: record.todayStatus || "Not Clocked In",
        className: "border-white/15 bg-white/5 text-white/55",
      };
    }

    return {
      text: record.todayStatus || "Present",
      className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
    };
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
              Manager Control Centre
            </h1>

            <p className="mt-2 text-white/55">
              Attendance, employees, leave, payroll and payslip management.
            </p>

            <p className="mt-3 text-sm text-[#d4ad63]">
              Company: {companyDisplayName}
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-[#d4ad63]/50 px-6 py-3 text-center font-semibold text-[#f0dfbd] hover:bg-white/5"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#d4ad63]/30 bg-[#1e2428] p-5 text-sm text-white/60">
          {isLoading
            ? "Loading company data..."
            : error
              ? error
              : "Company data loaded successfully."}
        </div>

        <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-[#d4ad63]/35 bg-[#1e2428] p-7 shadow-[0_24px_70px_rgba(0,0,0,0.22)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#d4ad63]/10 blur-[85px]" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#415d66]/10 blur-[90px]" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm tracking-[0.28em] text-[#d4ad63]">
                EXECUTIVE WORKSPACE
              </p>

              <h2 className="mt-3 text-3xl font-bold text-[#f0dfbd]">
                Wedge-I Executive Intelligence
              </h2>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/55">
                Analyse business health, cash position, labour efficiency,
                quarterly outlook and management priorities without leaving the
                Wedge Works platform.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  "Business Health",
                  "Cashflow Analysis",
                  "Quarterly Forecast",
                  "Executive Charts",
                ].map((capability) => (
                  <span
                    key={capability}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/50"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={openExecutiveWorkspace}
              className="shrink-0 rounded-full bg-[#d4ad63] px-8 py-4 font-bold text-[#101416] transition hover:bg-[#e4bf75]"
            >
              Open Wedge-I
            </button>
          </div>
        </section>

        <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {statCards.map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => router.push(card.href)}
              className={`rounded-2xl border border-[#d4ad63]/25 bg-white/5 p-5 text-left transition hover:border-[#d4ad63]/60 hover:bg-white/10 ${card.pulse ? "animate-pulse" : ""}`}
            >
              <p className="text-sm text-white/45">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-[#d4ad63]">{card.value}</p>
              <p className="mt-2 text-xs text-white/30">Open</p>
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
          <section className="rounded-[2rem] border border-white/10 bg-[#1e2428] p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm tracking-[0.25em] text-[#d4ad63]">
                  TODAY
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Live Attendance Status
                </h2>
              </div>

              <button
                type="button"
                onClick={() => router.push("/manager-dashboard/attendance")}
                className="text-sm font-semibold text-[#d4ad63] hover:underline"
              >
                Open Attendance
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#101416]">
              {attendance.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-lg font-semibold text-[#f0dfbd]">
                    No attendance records yet
                  </p>

                  <p className="mt-3 text-sm text-white/50">
                    Today&apos;s clock in, rest and clock out records will appear
                    here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-white/10 text-white/45">
                      <tr>
                        <th className="px-5 py-4">Employee</th>
                        <th className="px-5 py-4">Clock In</th>
                        <th className="px-5 py-4">Rest Out</th>
                        <th className="px-5 py-4">Rest In</th>
                        <th className="px-5 py-4">Clock Out</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {attendance.map((record) => {
                        const status = liveStatus(record);
                        return (
                        <tr key={record.id || record.employeeId} className="border-b border-white/5">
                          <td className="px-5 py-4 text-[#f0dfbd]">
                            {record.employeeName}
                          </td>

                          <td className="px-5 py-4 text-white/60">
                            {formatMalaysiaTime(record.clockIn)}
                          </td>

                          <td className="px-5 py-4 text-white/60">
                            {formatMalaysiaTime(record.restOut)}
                          </td>

                          <td className="px-5 py-4 text-white/60">
                            {formatMalaysiaTime(record.restIn)}
                          </td>

                          <td className="px-5 py-4 text-white/60">
                            {formatMalaysiaTime(record.clockOut)}
                          </td>

                          <td className="px-5 py-4">
                            <span className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold ${status.className}`}>
                              {status.text}
                            </span>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#d4ad63]/25 bg-[#1e2428] p-6">
            <p className="text-sm tracking-[0.25em] text-[#d4ad63]">
              SECURITY
            </p>

            <h2 className="mt-2 text-2xl font-bold">Access Rules</h2>

            <ul className="mt-5 space-y-3 text-sm text-white/60">
              <li>✓ Managers can only view their own company.</li>
              <li>✓ Employees can only view their own records.</li>
              <li>✓ Payslips are private to each employee.</li>
              <li>✓ Data sync must never bypass login security.</li>
              <li>✓ Attendance must stay fast during peak clock-in hours.</li>
            </ul>
          </section>
        </div>

        <section className="mt-10">
          <p className="text-sm tracking-[0.25em] text-[#d4ad63]">
            MANAGER MODULES
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {modules.map((module) => (
              <button
                key={module.title}
                type="button"
                onClick={() => router.push(module.href)}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-left transition hover:border-[#d4ad63]/60 hover:bg-white/10"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold text-[#f0dfbd]">
                    {module.title}
                  </h3>

                  <span className="rounded-full border border-[#d4ad63]/30 px-3 py-1 text-xs text-[#d4ad63]">
                    Open
                  </span>
                </div>

                <p className="mt-3 text-sm text-white/55">{module.text}</p>
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
