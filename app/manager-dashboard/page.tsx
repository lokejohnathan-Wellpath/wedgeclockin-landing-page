"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

const modules = [
  ["Live Attendance", "View clock in, rest out, rest in and clock out status."],
  ["Face Status", "Check which employees have completed face registration."],
  ["Employee Management", "Add, view and manage company employees."],
  ["Leave Approval", "Approve leave and review leave balances."],
  ["Payroll", "Enter salary, review payroll and generate payslips."],
  ["Payslip", "Employee payslip view, download and history."],
  ["CSV / Excel Export", "Export attendance, payroll and payslip records."],
  ["Workplace GPS", "Manage workplace location and GPS verification."],
];

function formatTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
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
        setError("API base URL is not configured.");
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

        if (!response.ok) {
          throw new Error(data?.message || "Dashboard data failed to load.");
        }

        setStats(data.stats);
        setAttendance(data.attendance || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Dashboard data failed to load."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("wc_manager_token");
    localStorage.removeItem("wc_company_id");
    localStorage.removeItem("wc_company_code");
    localStorage.removeItem("wc_company_name");
    localStorage.removeItem("wc_manager_id");
    router.push("/manager-login");
  }

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
              Secure company dashboard for attendance, face status, employees,
              leave, payroll and payslips.
            </p>

            {(companyCode || companyName) && (
              <p className="mt-3 text-sm text-[#d4ad63]">
                Company: {companyName || companyCode}
              </p>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="rounded-full border border-[#d4ad63]/50 px-6 py-3 text-center font-semibold text-[#f0dfbd] hover:bg-white/5"
          >
            Logout
          </button>
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#d4ad63]/30 bg-[#1e2428] p-5 text-sm text-white/60">
          {isLoading
            ? "Loading live company data..."
            : error
              ? error
              : "Live company data loaded securely from MongoDB Atlas."}
        </div>

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
              <p className="text-sm text-white/45">
                {isLoading ? "Loading..." : "Today"}
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#101416]">
              {attendance.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-lg font-semibold text-[#f0dfbd]">
                    No attendance data loaded
                  </p>
                  <p className="mt-3 text-sm text-white/50">
                    Today&apos;s clock in, rest out, rest in and clock out
                    records will appear here.
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
                            {formatTime(record.clockIn)}
                          </td>
                          <td className="px-5 py-4 text-white/60">
                            {formatTime(record.restOut)}
                          </td>
                          <td className="px-5 py-4 text-white/60">
                            {formatTime(record.restIn)}
                          </td>
                          <td className="px-5 py-4 text-white/60">
                            {formatTime(record.clockOut)}
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
            <h2 className="mt-2 text-2xl font-bold">Isolation Rules</h2>
            <ul className="mt-5 space-y-3 text-sm text-white/60">
              <li>✓ Company data must be filtered by companyId.</li>
              <li>✓ Managers must only see their own company data.</li>
              <li>✓ Employees must only see their own records.</li>
              <li>✓ Payslips must be private per employeeId.</li>
              <li>✓ MongoDB sync must never create login sessions.</li>
              <li>✓ Attendance writes must stay lightweight for peak times.</li>
            </ul>
          </section>
        </div>

        <section className="mt-10">
          <p className="text-sm tracking-[0.25em] text-[#d4ad63]">
            MANAGER MODULES
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {modules.map(([title, text]) => (
              <div
                key={title}
                className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6"
              >
                <h3 className="text-lg font-bold text-[#f0dfbd]">{title}</h3>
                <p className="mt-3 text-sm text-white/55">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}