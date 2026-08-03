"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import EmploymentPayrollModal from "./EmploymentPayrollModal";
import AddEmployeeModal from "./AddEmployeeModal";

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
  const [addingEmployee, setAddingEmployee] = useState(false);
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

          <div className="flex flex-wrap gap-3">
            <button onClick={() => setAddingEmployee(true)} className="rounded-full bg-emerald-500 px-6 py-3 font-bold text-[#07110c]">+ Add Employee</button>
            <button onClick={() => router.push("/manager-dashboard")} className="rounded-full border border-[#d4ad63]/50 px-6 py-3 font-semibold text-[#f0dfbd] hover:bg-white/5">Back to Dashboard</button>
          </div>
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

        <div className="mt-8">
          {filteredEmployees.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-[#1e2428] p-10 text-center">
              <p className="text-lg font-semibold text-[#f0dfbd]">
                No employees found
              </p>
              <p className="mt-3 text-sm text-white/50">
                Employees added from the app will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
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
                  <article
                    key={employee.id}
                    className="rounded-[1.75rem] border border-white/10 bg-[#1e2428] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:p-6"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-xl font-bold text-[#f0dfbd]">
                            {employee.fullName}
                          </h2>
                          <span className="rounded-full border border-[#d4ad63]/35 bg-[#d4ad63]/10 px-3 py-1 text-xs font-semibold text-[#e5c584]">
                            {employee.employeeCode}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              employee.isActive
                                ? "bg-emerald-500/10 text-emerald-200"
                                : "bg-white/5 text-white/45"
                            }`}
                          >
                            {employee.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-white/45">
                          {employee.department || "No department"} · {employee.position || "No position"}
                        </p>
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                        <button type="button" onClick={() => setSelectedEmployee(employee)} className="w-full shrink-0 rounded-xl bg-[#d4ad63] px-5 py-3 text-sm font-bold text-[#101416] shadow-[0_10px_28px_rgba(212,173,99,0.18)] transition hover:bg-[#e0bd79] lg:w-auto">Payroll, Leave &amp; OT Setup</button>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <EmployeeDetail label="Phone" value={employee.phoneNumber || "—"} />
                      <EmployeeDetail
                        label="Face registration"
                        value={employee.faceRegistered ? "Registered" : "Pending"}
                      />
                      <EmployeeDetail
                        label="Daily hours"
                        value={`${employee.expectedDailyHours || 0} hours`}
                      />
                      <div className="rounded-2xl border border-white/8 bg-[#151a1d] px-4 py-3">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/35">
                          Leave balance
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white/75">
                          Annual: {annualLeaveRemaining} days
                        </p>
                        <p className="mt-1 text-sm text-white/50">
                          MC: {medicalLeaveRemaining ?? "—"} days
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#151a1d] p-4 sm:flex-row sm:items-end sm:justify-between">
                      <div className="w-full sm:max-w-sm">
                        <label className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/35">
                          EPF No. Ahli
                        </label>
                        <input
                          inputMode="numeric"
                          value={employee.epfMemberNumber || ""}
                          onChange={(event) =>
                            updateEpfMemberNumber(employee.id, event.target.value)
                          }
                          placeholder="Enter EPF member number"
                          aria-label={`EPF member number for ${employee.fullName}`}
                          className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1315] px-4 py-3 text-white outline-none focus:border-[#d4ad63]"
                        />
                      </div>
                      <button
                        onClick={() => saveEpfMemberNumber(employee)}
                        disabled={savingEpfId === employee.id}
                        className="w-full rounded-xl border border-[#d4ad63]/45 px-5 py-3 text-sm font-semibold text-[#e5c584] transition hover:bg-[#d4ad63]/10 disabled:opacity-40 sm:w-auto"
                      >
                        {savingEpfId === employee.id ? "Saving…" : "Save EPF Number"}
                      </button>
                    </div>
                  </article>
                );
              })}
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
      {addingEmployee && (
        <AddEmployeeModal
          onClose={() => setAddingEmployee(false)}
          onCreated={() => {
            setMessage("Employee account created and onboarding records synchronised.");
            setReloadVersion((value) => value + 1);
          }}
        />
      )}
    </main>
  );
}

function EmployeeDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#151a1d] px-4 py-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-white/75">{value}</p>
    </div>
  );
}
