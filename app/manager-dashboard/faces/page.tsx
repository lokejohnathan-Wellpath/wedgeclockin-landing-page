"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Employee = {
  id: string;
  employeeCode?: string;
  fullName: string;
  department?: string;
  position?: string;
  phoneNumber?: string;
  isActive?: boolean;
  faceRegistered?: boolean;
  registeredFacePath?: string | null;
  updatedAt?: string;
};

function formatMalaysiaDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export default function FaceStatusPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "registered" | "pending"
  >("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEmployees() {
      const token = localStorage.getItem("wc_manager_token");
      const companyId = localStorage.getItem("wc_company_id");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!token) {
        router.push("/manager-login");
        return;
      }

      if (!companyId || !apiBaseUrl) {
        setError("Company session or API service is unavailable.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/employees?companyId=${encodeURIComponent(companyId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "AI face recognition status could not be loaded.",
          );
        }

        const employeeList: Employee[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.employees)
            ? data.employees
            : [];

        setEmployees(
          employeeList.filter((employee) => employee.isActive !== false),
        );
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "AI face recognition status could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadEmployees();
  }, [router]);

  const summary = useMemo(() => {
    const total = employees.length;
    const registered = employees.filter(
      (employee) => employee.faceRegistered === true,
    ).length;

    return {
      total,
      registered,
      pending: Math.max(0, total - registered),
      completionRate: total > 0 ? Math.round((registered / total) * 100) : 0,
    };
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const registered = employee.faceRegistered === true;

      if (statusFilter === "registered" && !registered) return false;
      if (statusFilter === "pending" && registered) return false;
      if (!query) return true;

      return [
        employee.fullName,
        employee.employeeCode,
        employee.department,
        employee.position,
        employee.phoneNumber,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [employees, search, statusFilter]);

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push("/manager-dashboard")}
              className="text-sm font-semibold text-[#d4ad63] hover:underline"
            >
              ← Back to Manager Dashboard
            </button>

            <p className="mt-6 text-sm tracking-[0.35em] text-[#d4ad63]">
              WEDGECLOCKIN
            </p>

            <h1 className="mt-2 text-4xl font-bold text-[#f0dfbd]">
              AI Face Recognition Status
            </h1>

            <p className="mt-2 max-w-3xl text-white/55">
              Review which employees have completed AI face registration for
              secure attendance verification.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/manager-dashboard/employees")}
            className="rounded-full border border-[#d4ad63]/50 px-6 py-3 font-semibold text-[#f0dfbd] transition hover:bg-white/5"
          >
            Open Employee Management
          </button>
        </header>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Active Employees"
            value={summary.total}
            description="Employees included in AI face monitoring."
          />
          <SummaryCard
            label="Face Registered"
            value={summary.registered}
            description="Employees ready for AI face verification."
          />
          <SummaryCard
            label="Pending Registration"
            value={summary.pending}
            description="Employees who still need face registration."
          />
          <SummaryCard
            label="Completion Rate"
            value={`${summary.completionRate}%`}
            description="Company-wide registration readiness."
          />
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#1e2428] p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm tracking-[0.25em] text-[#d4ad63]">
                FACE SECURITY
              </p>
              <h2 className="mt-2 text-2xl font-bold text-[#f0dfbd]">
                Employee registration status
              </h2>
              <p className="mt-2 text-sm text-white/45">
                AI recognition checks the live attendance face against the
                registered employee face.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employee..."
                className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-[#d4ad63] sm:w-72"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | "registered" | "pending",
                  )
                }
                className="rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]"
                aria-label="Face registration filter"
              >
                <option value="all">All employees</option>
                <option value="registered">Registered</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#101416] p-10 text-center text-white/55">
              Loading AI face recognition status...
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#101416] p-10 text-center">
              <h3 className="text-xl font-bold text-[#f0dfbd]">
                No matching employees
              </h3>
              <p className="mt-3 text-sm text-white/45">
                Adjust the search or registration filter.
              </p>
            </div>
          ) : (
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#101416]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left text-sm">
                  <thead className="border-b border-white/10 text-white/40">
                    <tr>
                      <th className="px-5 py-4">Employee</th>
                      <th className="px-5 py-4">Department</th>
                      <th className="px-5 py-4">Position</th>
                      <th className="px-5 py-4">AI Face Status</th>
                      <th className="px-5 py-4">Last Update</th>
                      <th className="px-5 py-4">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredEmployees.map((employee) => {
                      const registered = employee.faceRegistered === true;

                      return (
                        <tr
                          key={employee.id}
                          className="border-b border-white/5 last:border-b-0"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-[#f0dfbd]">
                              {employee.fullName}
                            </p>
                            <p className="mt-1 text-xs text-white/35">
                              {employee.employeeCode || employee.id}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-white/60">
                            {employee.department || "—"}
                          </td>

                          <td className="px-5 py-4 text-white/60">
                            {employee.position || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <FaceStatusBadge registered={registered} />
                          </td>

                          <td className="px-5 py-4 text-white/45">
                            {formatMalaysiaDate(employee.updatedAt)}
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                router.push("/manager-dashboard/employees")
                              }
                              className="rounded-full border border-[#d4ad63]/35 px-4 py-2 text-xs font-semibold text-[#d4ad63] transition hover:bg-[#d4ad63]/10"
                            >
                              {registered
                                ? "View Employee"
                                : "Open Registration"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-[#d4ad63]/20 bg-[#d4ad63]/5 p-5">
            <p className="text-sm font-semibold text-[#f0dfbd]">
              AI recognition workflow
            </p>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Registered means the employee has completed the approved face
              setup. During attendance, the live face capture is compared by
              the configured AI recognition service before the attendance
              action is accepted. Recognition confidence remains hidden from
              employees.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number | string;
  description: string;
}) {
  return (
    <article className="rounded-[1.5rem] border border-[#d4ad63]/25 bg-[#1e2428] p-5">
      <p className="text-sm text-white/45">{label}</p>
      <p className="mt-3 text-3xl font-bold text-[#d4ad63]">{value}</p>
      <p className="mt-3 text-xs leading-5 text-white/35">{description}</p>
    </article>
  );
}

function FaceStatusBadge({ registered }: { registered: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold ${
        registered
          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border-amber-400/30 bg-amber-400/10 text-amber-200"
      }`}
    >
      {registered ? "AI Face Registered" : "Pending Registration"}
    </span>
  );
}