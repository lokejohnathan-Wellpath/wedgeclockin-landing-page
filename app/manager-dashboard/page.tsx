"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  id: string;
  employeeName: string;
  clockIn: string | null;
  restOut: string | null;
  restIn: string | null;
  clockOut: string | null;
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
];

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
        const response = await fetch(`${apiBaseUrl}/api/manager/dashboard`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (expireManagerSession(response)) return;

        if (!response.ok) {
          throw new Error(data?.message || "Dashboard could not be loaded.");
        }

        setStats(data.stats);
        setAttendance(data.attendance || []);
      } catch {
        setError("Dashboard could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function handleLogout() {
    clearManagerSession();
    router.push("/manager-login");
  }

  function openExecutiveWorkspace() {
    router.push("/wedge-i");
  }

  const companyDisplayName = companyName || companyCode || "Company";

  const statCards = [
    ["Employees", stats?.employees ?? "—"],
    ["Present", stats?.present ?? "—"],
    ["On Leave", stats?.onLeave ?? "—"],
    ["Absent", stats?.absent ?? "—"],
    ["Face Registered", stats?.faceRegistered ?? "—"],
    ["Pending Face", stats?.pendingFace ?? "—"],
  ];

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
          {statCards.map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#d4ad63]/25 bg-white/5 p-5"
            >
              <p className="text-sm text-white/45">{label}</p>
              <p className="mt-2 text-3xl font-bold text-[#d4ad63]">{value}</p>
            </div>
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
                      </tr>
                    </thead>

                    <tbody>
                      {attendance.map((record) => (
                        <tr key={record.id} className="border-b border-white/5">
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
                        </tr>
                      ))}
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
