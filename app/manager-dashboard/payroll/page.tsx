"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Employee = {
  id: string;
  employeeCode?: string;
  fullName: string;
  isActive?: boolean;
};

type PayrollRecord = {
  id: string;
  companyId: string;
  companyCode: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  basicSalary: number;
  allowanceA: number;
  allowanceB: number;
  allowanceC: number;
  epfDeduction: number;
  socsoDeduction: number;
  eisDeduction: number;
  taxDeduction: number;
  otherDeduction: number;
  otHours: number;
  otRate: number;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
};

type PayrollForm = {
  employeeId: string;
  month: string;
  year: string;
  basicSalary: string;
  allowanceA: string;
  allowanceB: string;
  allowanceC: string;
  epfDeduction: string;
  socsoDeduction: string;
  eisDeduction: string;
  taxDeduction: string;
  otherDeduction: string;
  otHours: string;
  otRate: string;
  remarks: string;
};

const currentDate = new Date();

const initialForm: PayrollForm = {
  employeeId: "",
  month: String(currentDate.getMonth() + 1),
  year: String(currentDate.getFullYear()),
  basicSalary: "",
  allowanceA: "0",
  allowanceB: "0",
  allowanceC: "0",
  epfDeduction: "0",
  socsoDeduction: "0",
  eisDeduction: "0",
  taxDeduction: "0",
  otherDeduction: "0",
  otHours: "0",
  otRate: "0",
  remarks: "",
};

function parseAmount(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return parsed;
}

function money(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);
}

function monthName(month: number) {
  return new Intl.DateTimeFormat("en-MY", {
    month: "long",
  }).format(new Date(2026, month - 1, 1));
}

function calculatePayroll(record: PayrollRecord) {
  const otAmount = record.otHours * record.otRate;

  const grossPay =
    record.basicSalary +
    record.allowanceA +
    record.allowanceB +
    record.allowanceC +
    otAmount;

  const totalDeductions =
    record.epfDeduction +
    record.socsoDeduction +
    record.eisDeduction +
    record.taxDeduction +
    record.otherDeduction;

  return {
    otAmount,
    grossPay,
    totalDeductions,
    netPay: grossPay - totalDeductions,
  };
}

export default function PayrollPage() {
  const router = useRouter();

  const [form, setForm] = useState<PayrollForm>(initialForm);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<PayrollRecord[]>([]);

  const [activeView, setActiveView] = useState<"entry" | "summary">("entry");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const calculations = useMemo(() => {
    const basicSalary = parseAmount(form.basicSalary);
    const allowanceA = parseAmount(form.allowanceA);
    const allowanceB = parseAmount(form.allowanceB);
    const allowanceC = parseAmount(form.allowanceC);

    const otHours = parseAmount(form.otHours);
    const otRate = parseAmount(form.otRate);
    const otAmount = otHours * otRate;

    const grossPay =
      basicSalary + allowanceA + allowanceB + allowanceC + otAmount;

    const totalDeductions =
      parseAmount(form.epfDeduction) +
      parseAmount(form.socsoDeduction) +
      parseAmount(form.eisDeduction) +
      parseAmount(form.taxDeduction) +
      parseAmount(form.otherDeduction);

    return {
      otAmount,
      grossPay,
      totalDeductions,
      netPay: grossPay - totalDeductions,
    };
  }, [form]);

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
          `${apiBaseUrl}/api/employees?companyId=${encodeURIComponent(
            companyId,
          )}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message || "Employees could not be loaded.");
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
            : "Employees could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadEmployees();
  }, [router]);

  async function loadPayrollSummary() {
    const token = localStorage.getItem("wc_manager_token");
    const companyId = localStorage.getItem("wc_company_id");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    const month = Number(form.month);
    const year = Number(form.year);

    if (!token) {
      router.push("/manager-login");
      return;
    }

    if (!companyId || !apiBaseUrl) {
      setError("Company session or API service is unavailable.");
      return;
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      setError("Month must be between 1 and 12.");
      return;
    }

    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      setError("Please enter a valid year.");
      return;
    }

    setIsLoadingSummary(true);
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/payroll?companyId=${encodeURIComponent(
          companyId,
        )}&month=${month}&year=${year}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Payroll summary could not be loaded.");
      }

      setRecords(Array.isArray(data) ? data : []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Payroll summary could not be loaded.",
      );
    } finally {
      setIsLoadingSummary(false);
    }
  }

  function updateField<K extends keyof PayrollForm>(
    field: K,
    value: PayrollForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setError("");
  }

  function validateForm() {
    const month = Number(form.month);
    const year = Number(form.year);

    if (!form.employeeId) {
      return "Please select an employee.";
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return "Month must be between 1 and 12.";
    }

    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      return "Please enter a valid year.";
    }

    const requiredNumbers: Array<[string, string]> = [
      ["Basic Salary", form.basicSalary],
      ["Allowance A", form.allowanceA],
      ["Allowance B", form.allowanceB],
      ["Allowance C", form.allowanceC],
      ["EPF Deduction", form.epfDeduction],
      ["SOCSO Deduction", form.socsoDeduction],
      ["EIS Deduction", form.eisDeduction],
      ["Tax Deduction", form.taxDeduction],
      ["Other Deduction", form.otherDeduction],
      ["OT Hours", form.otHours],
      ["OT Rate", form.otRate],
    ];

    for (const [label, value] of requiredNumbers) {
      if (value.trim() === "") {
        return `${label} is required. Enter 0 if none.`;
      }

      const parsed = Number(value);

      if (!Number.isFinite(parsed) || parsed < 0) {
        return `${label} must be 0 or more.`;
      }
    }

    return "";
  }

  async function savePayroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const token = localStorage.getItem("wc_manager_token");
    const companyId = localStorage.getItem("wc_company_id");
    const companyCode = localStorage.getItem("wc_company_code");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!token) {
      router.push("/manager-login");
      return;
    }

    if (!companyId || !companyCode || !apiBaseUrl) {
      setError("Company session or API service is unavailable.");
      return;
    }

    const employee = employees.find(
      (item) => item.id === form.employeeId,
    );

    if (!employee) {
      setError("The selected employee could not be found.");
      return;
    }

    const month = Number(form.month);
    const year = Number(form.year);

    const payroll: PayrollRecord = {
      id: `${employee.id}_${month}_${year}`,
      companyId,
      companyCode,
      employeeId: employee.id,
      employeeName: employee.fullName,
      month,
      year,
      basicSalary: parseAmount(form.basicSalary),
      allowanceA: parseAmount(form.allowanceA),
      allowanceB: parseAmount(form.allowanceB),
      allowanceC: parseAmount(form.allowanceC),
      epfDeduction: parseAmount(form.epfDeduction),
      socsoDeduction: parseAmount(form.socsoDeduction),
      eisDeduction: parseAmount(form.eisDeduction),
      taxDeduction: parseAmount(form.taxDeduction),
      otherDeduction: parseAmount(form.otherDeduction),
      otHours: parseAmount(form.otHours),
      otRate: parseAmount(form.otRate),
      remarks: form.remarks.trim(),
    };

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/payroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payroll),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Payroll could not be saved.");
      }

      setMessage(
        `Payroll saved successfully. Net Pay: ${money(
          calculations.netPay,
        )}`,
      );

      await loadPayrollSummary();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Payroll could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function openSummary() {
    setActiveView("summary");
    await loadPayrollSummary();
  }

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
              Payroll
            </h1>

            <p className="mt-2 text-white/55">
              The same payroll records used by the WedgeCLOCKin mobile app.
            </p>
          </div>

          <div className="flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setActiveView("entry")}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                activeView === "entry"
                  ? "bg-[#d4ad63] text-[#101416]"
                  : "text-white/55 hover:text-white"
              }`}
            >
              Payroll Entry
            </button>

            <button
              type="button"
              onClick={openSummary}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                activeView === "summary"
                  ? "bg-[#d4ad63] text-[#101416]"
                  : "text-white/55 hover:text-white"
              }`}
            >
              Payroll Summary
            </button>
          </div>
        </header>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}

        {activeView === "entry" ? (
          <form
            onSubmit={savePayroll}
            className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"
          >
            <section className="rounded-[2rem] border border-white/10 bg-[#1e2428] p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-[#f0dfbd]">
                Payroll Entry
              </h2>

              <div className="mt-6">
                <label className="text-sm text-white/55">Employee</label>

                <select
                  value={form.employeeId}
                  onChange={(event) =>
                    updateField("employeeId", event.target.value)
                  }
                  disabled={isLoading}
                  className={inputClassName}
                >
                  <option value="">
                    {isLoading
                      ? "Loading employees..."
                      : "Select an employee"}
                  </option>

                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName}
                      {employee.employeeCode
                        ? ` (${employee.employeeCode})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <SectionTitle title="Payroll Period" />

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="Month"
                  value={form.month}
                  onChange={(value) => updateField("month", value)}
                />

                <NumberField
                  label="Year"
                  value={form.year}
                  onChange={(value) => updateField("year", value)}
                />
              </div>

              <SectionTitle title="Salary" />

              <MoneyField
                label="Basic Salary"
                value={form.basicSalary}
                onChange={(value) => updateField("basicSalary", value)}
              />

              <SectionTitle title="Allowances" />

              <div className="grid gap-4 sm:grid-cols-2">
                <MoneyField
                  label="Allowance A"
                  value={form.allowanceA}
                  onChange={(value) => updateField("allowanceA", value)}
                />

                <MoneyField
                  label="Allowance B"
                  value={form.allowanceB}
                  onChange={(value) => updateField("allowanceB", value)}
                />
              </div>

              <div className="mt-4">
                <MoneyField
                  label="Allowance C"
                  value={form.allowanceC}
                  onChange={(value) => updateField("allowanceC", value)}
                />
              </div>

              <SectionTitle title="Overtime" />

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="OT Hours"
                  value={form.otHours}
                  onChange={(value) => updateField("otHours", value)}
                />

                <MoneyField
                  label="OT Rate"
                  value={form.otRate}
                  onChange={(value) => updateField("otRate", value)}
                />
              </div>

              <SectionTitle title="Statutory / Other Deductions" />

              <div className="grid gap-4 sm:grid-cols-2">
                <MoneyField
                  label="EPF Deduction"
                  value={form.epfDeduction}
                  onChange={(value) =>
                    updateField("epfDeduction", value)
                  }
                />

                <MoneyField
                  label="SOCSO Deduction"
                  value={form.socsoDeduction}
                  onChange={(value) =>
                    updateField("socsoDeduction", value)
                  }
                />

                <MoneyField
                  label="EIS Deduction"
                  value={form.eisDeduction}
                  onChange={(value) =>
                    updateField("eisDeduction", value)
                  }
                />

                <MoneyField
                  label="Tax Deduction"
                  value={form.taxDeduction}
                  onChange={(value) =>
                    updateField("taxDeduction", value)
                  }
                />
              </div>

              <div className="mt-4">
                <MoneyField
                  label="Other Deduction"
                  value={form.otherDeduction}
                  onChange={(value) =>
                    updateField("otherDeduction", value)
                  }
                />
              </div>

              <div className="mt-6">
                <label className="text-sm text-white/55">Remarks</label>

                <textarea
                  value={form.remarks}
                  onChange={(event) =>
                    updateField("remarks", event.target.value)
                  }
                  rows={3}
                  className={inputClassName}
                  placeholder="Optional payroll remarks"
                />
              </div>
            </section>

            <aside className="h-fit rounded-[2rem] border border-[#d4ad63]/30 bg-[#1e2428] p-6 sm:p-8 xl:sticky xl:top-8">
              <p className="text-sm tracking-[0.25em] text-[#d4ad63]">
                PAYROLL SUMMARY
              </p>

              <h2 className="mt-3 text-2xl font-bold text-[#f0dfbd]">
                {monthName(Number(form.month) || currentDate.getMonth() + 1)}{" "}
                {form.year}
              </h2>

              <div className="mt-7 space-y-4">
                <SummaryRow
                  label="OT Amount"
                  value={calculations.otAmount}
                />
                <SummaryRow
                  label="Gross Pay"
                  value={calculations.grossPay}
                />
                <SummaryRow
                  label="Total Deductions"
                  value={calculations.totalDeductions}
                />
                <SummaryRow
                  label="Net Pay"
                  value={calculations.netPay}
                  bold
                />
              </div>

              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="mt-8 w-full rounded-full bg-[#d4ad63] px-8 py-4 font-bold text-[#101416] transition hover:bg-[#e4bf75] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving Payroll..." : "Save Payroll"}
              </button>
            </aside>
          </form>
        ) : (
          <section className="mt-8">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[#1e2428] p-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm tracking-[0.25em] text-[#d4ad63]">
                  PAYROLL PERIOD
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#f0dfbd]">
                  {monthName(Number(form.month) || 1)} {form.year}
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="number"
                  value={form.month}
                  onChange={(event) =>
                    updateField("month", event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63] sm:w-28"
                  aria-label="Payroll month"
                />

                <input
                  type="number"
                  value={form.year}
                  onChange={(event) =>
                    updateField("year", event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63] sm:w-32"
                  aria-label="Payroll year"
                />

                <button
                  type="button"
                  onClick={loadPayrollSummary}
                  className="rounded-full border border-[#d4ad63]/50 px-6 py-3 font-semibold text-[#f0dfbd] hover:bg-white/5"
                >
                  Refresh
                </button>
              </div>
            </div>

            {isLoadingSummary ? (
              <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#1e2428] p-10 text-center text-white/55">
                Loading payroll records...
              </div>
            ) : records.length === 0 ? (
              <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#1e2428] p-10 text-center">
                <h3 className="text-xl font-bold text-[#f0dfbd]">
                  No payroll records saved yet
                </h3>

                <p className="mt-3 text-sm text-white/50">
                  Save payroll for this month from the mobile app or the web
                  payroll entry form.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1e2428]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left text-sm">
                    <thead className="border-b border-white/10 text-white/45">
                      <tr>
                        <th className="px-5 py-4">Employee</th>
                        <th className="px-5 py-4">Basic Salary</th>
                        <th className="px-5 py-4">Allowances</th>
                        <th className="px-5 py-4">OT Hours</th>
                        <th className="px-5 py-4">OT Amount</th>
                        <th className="px-5 py-4">Gross Pay</th>
                        <th className="px-5 py-4">Deductions</th>
                        <th className="px-5 py-4">Net Pay</th>
                        <th className="px-5 py-4">Remarks</th>
                      </tr>
                    </thead>

                    <tbody>
                      {records.map((record) => {
                        const result = calculatePayroll(record);
                        const allowances =
                          record.allowanceA +
                          record.allowanceB +
                          record.allowanceC;

                        return (
                          <tr
                            key={record.id}
                            className="border-b border-white/5"
                          >
                            <td className="px-5 py-4">
                              <p className="font-semibold text-[#f0dfbd]">
                                {record.employeeName}
                              </p>
                              <p className="mt-1 text-xs text-white/35">
                                {record.employeeId}
                              </p>
                            </td>

                            <td className="px-5 py-4 text-white/60">
                              {money(record.basicSalary)}
                            </td>

                            <td className="px-5 py-4 text-white/60">
                              {money(allowances)}
                            </td>

                            <td className="px-5 py-4 text-white/60">
                              {record.otHours.toFixed(2)}
                            </td>

                            <td className="px-5 py-4 text-white/60">
                              {money(result.otAmount)}
                            </td>

                            <td className="px-5 py-4 text-white/60">
                              {money(result.grossPay)}
                            </td>

                            <td className="px-5 py-4 text-white/60">
                              {money(result.totalDeductions)}
                            </td>

                            <td className="px-5 py-4 font-bold text-[#d4ad63]">
                              {money(result.netPay)}
                            </td>

                            <td className="max-w-[220px] px-5 py-4 text-white/45">
                              {record.remarks || "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}
      </section>
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="mb-3 mt-7 text-base font-bold text-[#f0dfbd]">
      {title}
    </h3>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm text-white/55">{label}</label>

      <div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-[#101416] focus-within:border-[#d4ad63]">
        <span className="flex items-center border-r border-white/10 px-4 text-sm text-white/40">
          RM
        </span>

        <input
          type="number"
          min="0"
          step="0.01"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent px-4 py-3 text-white outline-none"
        />
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm text-white/55">{label}</label>

      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClassName}
      />
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b border-white/8 pb-4 ${
        bold ? "text-lg font-bold text-[#f0dfbd]" : "text-white/55"
      }`}
    >
      <span>{label}</span>
      <span className={bold ? "text-[#d4ad63]" : "text-white/75"}>
        {money(value)}
      </span>
    </div>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]";