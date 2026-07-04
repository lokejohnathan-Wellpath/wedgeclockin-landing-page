"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const stats = [
  ["Employees", "—"],
  ["Present", "—"],
  ["On Leave", "—"],
  ["Absent", "—"],
  ["Face Registered", "—"],
  ["Pending Face", "—"],
];

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

export default function ManagerDashboardPage() {
  const router = useRouter();
  const [companyCode, setCompanyCode] = useState("");
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("wc_manager_token");
    const storedCompanyCode = localStorage.getItem("wc_company_code");
    const storedCompanyName = localStorage.getItem("wc_company_name");

    if (!token) {
      router.push("/manager-login");
      return;
    }

    setCompanyCode(storedCompanyCode || "");
    setCompanyName(storedCompanyName || "");
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("wc_manager_token");
    localStorage.removeItem("wc_company_id");
    localStorage.removeItem("wc_company_code");
    localStorage.removeItem("wc_company_name");
    localStorage.removeItem("wc_manager_id");
    router.push("/manager-login");
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
          Dashboard shell is ready. Live company data will appear here after
          secure manager authentication is wired to the API.
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {stats.map(([label, value]) => (
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
              <p className="text-sm text-white/45">Awaiting secure API data</p>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-[#101416] p-8 text-center">
              <p className="text-lg font-semibold text-[#f0dfbd]">
                No attendance data loaded
              </p>
              <p className="mt-3 text-sm text-white/50">
                Once manager authentication is connected, this area will show
                each employee&apos;s clock in, rest out, rest in, clock out,
                face status and GPS verification.
              </p>
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