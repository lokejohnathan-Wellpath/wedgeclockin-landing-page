"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import EmploymentPayrollModal from "./EmploymentPayrollModal";

type Employee = {
  id: string;
  employeeCode: string;
  epfMemberNumber?: string;
  fullName: string;
  department: string;
  position: string;
  phoneNumber: string;
  isActive: boolean;
  faceRegistered: boolean;
  expectedDailyHours: number;
  annualLeaveEntitlement: number;
  annualLeaveUsed: number;
  leaveBalance?: {
    annualLeaveBalance: number | null;
    medicalLeaveBalance: number | null;
  };
};

type StoredLeaveBalance = {
  employeeId: string;
  annualLeaveBalance: number | null;
  medicalLeaveBalance: number | null;
};

export default function ManagerEmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingEpfId, setSavingEpfId] = useState("");
  const [message, setMessage] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    async function loadEmployees() {
      const token = localStorage.getItem("wc_manager_token");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!token) {
        router.push("/manager-login");
        return;
      }

      if (!apiBaseUrl) {
        setError("Service is not configured.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/manager/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Employees could not be loaded.");
        }

        const loadedEmployees: Employee[] = data.employees || [];

        try {
          const balanceResponse = await fetch(`${apiBaseUrl}/api/leaves/balances`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const storedBalances: StoredLeaveBalance[] = balanceResponse.ok
            ? await balanceResponse.json()
            : [];
          const balancesByEmployee = new Map(
            storedBalances.map((balance) => [balance.employeeId, balance]),
          );

          setEmployees(
            loadedEmployees.map((employee) => ({
              ...employee,
              leaveBalance: balancesByEmployee.get(employee.id),
            })),
          );
        } catch {
          setEmployees(loadedEmployees);
        }
      } catch {
        setError("Employees could not be loaded.");
      } finally {
        setIsLoading(false);
      }
    }

    loadEmployees();
  }, [router, reloadVersion]);

  const filteredEmployees = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return employees;

    return employees.filter((employee) =>
      [
        employee.employeeCode,
        employee.fullName,
        employee.department,
        employee.position,
        employee.phoneNumber,
      ]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [employees, search]);

  function updateEpfMemberNumber(employeeId: string, value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 20);
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === employeeId
          ? { ...employee, epfMemberNumber: digits }
          : employee
      )
    );
    setMessage("");
  }

  async function saveEpfMemberNumber(employee: Employee) {
    const token = localStorage.getItem("wc_manager_token");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token || !apiBaseUrl) {
      setError("Manager session has expired.");
      return;
    }

    setSavingEpfId(employee.id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/manager/employees/${encodeURIComponent(employee.id)}/statutory`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            epfMemberNumber: employee.epfMemberNumber || "",
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "EPF member number could not be saved.");
      }
      setMessage(`EPF member number saved for ${employee.fullName}.`);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "EPF member number could not be saved."
      );
    } finally {
      setSavingEpfId("");
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
              Employee Management
            </h1>
            <p className="mt-2 text-white/55">
              View employees, face status, work details and active status.
            </p>
          </div>

          <button
            onClick={() => router.push("/manager-dashboard")}
            className="rounded-full border border-[#d4ad63]/50 px-6 py-3 font-semibold text-[#f0dfbd] hover:bg-white/5"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-[2rem] border border-[#d4ad63]/30 bg-[#1e2428] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-[#f0dfbd]">
              {isLoading
                ? "Loading employees..."
                : `${filteredEmployees.length} employee(s) found`}
            </p>
            <p className="mt-1 text-sm text-white/50">
              Company employee records loaded successfully.
            </p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee..."
            className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63] md:max-w-sm"
          />
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-200">
            {error}
          </div>
        )}
        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
            {message}
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1e2428]">
          {filteredEmployees.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold text-[#f0dfbd]">
                No employees found
              </p>
              <p className="mt-3 text-sm text-white/50">
                Employees added from the app will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-white/45">
                  <tr>
                    <th className="px-5 py-4">Code</th>
                    <th className="px-5 py-4">EPF No. Ahli</th>
                    <th className="px-5 py-4">Name</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Position</th>
                    <th className="px-5 py-4">Phone</th>
                    <th className="px-5 py-4">Face</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Daily Hours</th>
                    <th className="px-5 py-4">Leave</th>
                    <th className="px-5 py-4">Payroll Setup</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEmployees.map((employee) => {
                    const annualLeaveRemaining =
                      employee.leaveBalance?.annualLeaveBalance ??
                      Math.max(
                        0,
                        employee.annualLeaveEntitlement - employee.annualLeaveUsed,
                      );
                    const medicalLeaveRemaining =
                      employee.leaveBalance?.medicalLeaveBalance;

                    return (
                      <tr key={employee.id} className="border-b border-white/5">
                        <td className="px-5 py-4 text-[#d4ad63]">
                          {employee.employeeCode}
                        </td>
                        <td className="min-w-56 px-5 py-4">
                          <div className="flex items-center gap-2">
                            <input
                              inputMode="numeric"
                              value={employee.epfMemberNumber || ""}
                              onChange={(event) =>
                                updateEpfMemberNumber(employee.id, event.target.value)
                              }
                              placeholder="No. Ahli"
                              aria-label={`EPF member number for ${employee.fullName}`}
                              className="w-32 rounded-xl border border-white/10 bg-[#101416] px-3 py-2 text-white outline-none focus:border-[#d4ad63]"
                            />
                            <button
                              onClick={() => saveEpfMemberNumber(employee)}
                              disabled={savingEpfId === employee.id}
                              className="rounded-full border border-[#d4ad63]/40 px-3 py-2 text-xs font-semibold text-[#d4ad63] disabled:opacity-40"
                            >
                              {savingEpfId === employee.id ? "Saving…" : "Save"}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-semibold text-[#f0dfbd]">
                          {employee.fullName}
                        </td>
                        <td className="px-5 py-4 text-white/60">
                          {employee.department || "—"}
                        </td>
                        <td className="px-5 py-4 text-white/60">
                          {employee.position || "—"}
                        </td>
                        <td className="px-5 py-4 text-white/60">
                          {employee.phoneNumber || "—"}
                        </td>
                        <td className="px-5 py-4 text-white/60">
                          {employee.faceRegistered ? "Registered" : "Pending"}
                        </td>
                        <td className="px-5 py-4 text-white/60">
                          {employee.isActive ? "Active" : "Inactive"}
                        </td>
                        <td className="px-5 py-4 text-white/60">
                          {employee.expectedDailyHours}
                        </td>
                        <td className="min-w-32 px-5 py-4 text-white/60">
                          <span className="block whitespace-nowrap">
                            Annual Leave: {annualLeaveRemaining}
                          </span>
                          <span className="mt-1 block whitespace-nowrap text-white/45">
                            MC: {medicalLeaveRemaining ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedEmployee(employee)}
                            className="whitespace-nowrap rounded-full border border-[#d4ad63]/45 px-4 py-2 text-xs font-semibold text-[#f0dfbd] hover:bg-[#d4ad63]/10"
                          >
                            Edit Pay, Leave & OT
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
      </section>
      {selectedEmployee && (
        <EmploymentPayrollModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onSaved={() => {
            setMessage(`Employment and payroll profile saved for ${selectedEmployee.fullName}.`);
            setReloadVersion((value) => value + 1);
          }}
        />
      )}
    </main>
  );
}
