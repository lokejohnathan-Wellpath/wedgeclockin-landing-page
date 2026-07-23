"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateMalaysiaStatutory } from "../../lib/malaysiaStatutory";

type EmployeePayrollDefaults = {
  basicSalary?: number;
  allowanceALabel?: string;
  allowanceAAmount?: number;
  allowanceBLabel?: string;
  allowanceBAmount?: number;
  allowanceCLabel?: string;
  allowanceCAmount?: number;
  otRate?: number;
};

type Employee = {
  id: string;
  employeeCode?: string;
  fullName: string;
  isActive?: boolean;
  payrollDefaults?: EmployeePayrollDefaults;
};

type PayrollStatus = "draft" | "issued";

type PayrollRecord = {
  id: string;
  companyId: string;
  companyCode: string;
  employeeId: string;
  employeeName: string;
  month: number;
  year: number;
  basicSalary: number;
  allowanceALabel?: string;
  allowanceBLabel?: string;
  allowanceCLabel?: string;
  allowanceA: number;
  allowanceB: number;
  allowanceC: number;
  epfDeduction: number;
  epfEmployerContribution?: number;
  socsoDeduction: number;
  socsoEmployerContribution?: number;
  eisDeduction: number;
  eisEmployerContribution?: number;
  taxDeduction: number;
  otherDeduction: number;
  otHours: number;
  otRate: number;
  approvedOtMinutes?: number;
  otSource?: "manual" | "approved-roster";
  useApprovedRosterOt?: boolean;
  status?: PayrollStatus;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
};

type PayrollForm = {
  employeeId: string;
  month: string;
  year: string;
  basicSalary: string;
  allowanceALabel: string;
  allowanceA: string;
  allowanceBLabel: string;
  allowanceB: string;
  allowanceCLabel: string;
  allowanceC: string;
  epfDeduction: string;
  socsoDeduction: string;
  eisDeduction: string;
  taxDeduction: string;
  otherDeduction: string;
  otHours: string;
  otRate: string;
  status: PayrollStatus;
  remarks: string;
};

const currentDate = new Date();

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const years = Array.from(
  { length: 16 },
  (_, index) => currentDate.getFullYear() - 5 + index,
);

const initialForm: PayrollForm = {
  employeeId: "",
  month: String(currentDate.getMonth() + 1),
  year: String(currentDate.getFullYear()),
  basicSalary: "",
  allowanceALabel: "Allowance A",
  allowanceA: "0",
  allowanceBLabel: "Allowance B",
  allowanceB: "0",
  allowanceCLabel: "Allowance C",
  allowanceC: "0",
  epfDeduction: "0",
  socsoDeduction: "0",
  eisDeduction: "0",
  taxDeduction: "0",
  otherDeduction: "0",
  otHours: "0",
  otRate: "0",
  status: "draft",
  remarks: "",
};

function parseAmount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function money(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    minimumFractionDigits: 2,
  }).format(value);
}

function monthName(month: number) {
  return months.find((item) => Number(item.value) === month)?.label ?? String(month);
}

function cleanLabel(value: string, fallback: string) {
  return value.trim() || fallback;
}

function calculatePayroll(record: PayrollRecord) {
  const otAmount = record.otHours * record.otRate;
  const allowances = record.allowanceA + record.allowanceB + record.allowanceC;
  const grossPay = record.basicSalary + allowances + otAmount;
  const totalDeductions =
    record.epfDeduction +
    record.socsoDeduction +
    record.eisDeduction +
    record.taxDeduction +
    record.otherDeduction;

  return {
    allowances,
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
  const [approvedOtMessage, setApprovedOtMessage] = useState("");
  const [useApprovedRosterOt, setUseApprovedRosterOt] = useState(false);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === form.employeeId) ?? null,
    [employees, form.employeeId],
  );

  const calculations = useMemo(() => {
    const basicSalary = parseAmount(form.basicSalary);
    const allowanceA = parseAmount(form.allowanceA);
    const allowanceB = parseAmount(form.allowanceB);
    const allowanceC = parseAmount(form.allowanceC);
    const otAmount = parseAmount(form.otHours) * parseAmount(form.otRate);
    const totalAllowances = allowanceA + allowanceB + allowanceC;
    const grossPay = basicSalary + totalAllowances + otAmount;
    const statutory = calculateMalaysiaStatutory(basicSalary + totalAllowances, grossPay);
    const totalDeductions =
      statutory.epfEmployee +
      statutory.socsoEmployee +
      statutory.eisEmployee +
      statutory.pcbEstimate +
      parseAmount(form.otherDeduction);

    return {
      totalAllowances,
      otAmount,
      grossPay,
      totalDeductions,
      netPay: grossPay - totalDeductions,
      statutory,
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
          `${apiBaseUrl}/api/manager/employees`,
          { headers: { Authorization: `Bearer ${token}` } },
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

        setEmployees(employeeList.filter((employee) => employee.isActive !== false));
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

  useEffect(() => {
    async function loadApprovedOvertime() {
      const token = localStorage.getItem("wc_manager_token");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const month = Number(form.month);
      const year = Number(form.year);

      if (!token || !apiBaseUrl || !form.employeeId || !month || !year) {
        setApprovedOtMessage("");
        return;
      }

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/manager/overtime/approved-total?employeeId=${encodeURIComponent(
            form.employeeId
          )}&month=${month}&year=${year}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();
        if (!response.ok) throw new Error();
        const hours = Number(data.hours || 0);
        const managedByRoster = Boolean(data.managedByRoster);
        setUseApprovedRosterOt(managedByRoster);
        if (managedByRoster) {
          setForm((current) => ({ ...current, otHours: hours.toFixed(2) }));
        }
        setApprovedOtMessage(
          managedByRoster
            ? hours > 0
              ? `${hours.toFixed(2)} approved roster OT hour(s) loaded automatically.`
              : "Roster is active; no OT has been approved for this employee and month."
            : "Roster OT is not active for this employee and month; manual OT remains available."
        );
      } catch {
        setUseApprovedRosterOt(false);
        setApprovedOtMessage("Approved roster OT could not be loaded.");
      }
    }

    loadApprovedOvertime();
  }, [form.employeeId, form.month, form.year]);

  function updateField<K extends keyof PayrollForm>(
    field: K,
    value: PayrollForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage("");
    setError("");
  }

  function handleEmployeeChange(employeeId: string) {
    const employee = employees.find((item) => item.id === employeeId);
    const defaults = employee?.payrollDefaults;

    setForm((current) => ({
      ...current,
      employeeId,
      basicSalary:
        defaults?.basicSalary !== undefined
          ? String(defaults.basicSalary)
          : current.basicSalary,
      allowanceALabel: cleanLabel(defaults?.allowanceALabel ?? "", "Allowance A"),
      allowanceA:
        defaults?.allowanceAAmount !== undefined
          ? String(defaults.allowanceAAmount)
          : "0",
      allowanceBLabel: cleanLabel(defaults?.allowanceBLabel ?? "", "Allowance B"),
      allowanceB:
        defaults?.allowanceBAmount !== undefined
          ? String(defaults.allowanceBAmount)
          : "0",
      allowanceCLabel: cleanLabel(defaults?.allowanceCLabel ?? "", "Allowance C"),
      allowanceC:
        defaults?.allowanceCAmount !== undefined
          ? String(defaults.allowanceCAmount)
          : "0",
      otRate: defaults?.otRate !== undefined ? String(defaults.otRate) : current.otRate,
    }));

    setMessage("");
    setError("");
  }

  function validateForm() {
    const month = Number(form.month);
    const year = Number(form.year);

    if (!form.employeeId) return "Please select an employee.";
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return "Please select a valid month.";
    }
    if (!Number.isInteger(year) || year < 2020 || year > 2100) {
      return "Please select a valid year.";
    }

    const requiredNumbers: Array<[string, string]> = [
      ["Basic Salary", form.basicSalary],
      [form.allowanceALabel || "Allowance A", form.allowanceA],
      [form.allowanceBLabel || "Allowance B", form.allowanceB],
      [form.allowanceCLabel || "Allowance C", form.allowanceC],
      ["EPF Deduction", form.epfDeduction],
      ["SOCSO Deduction", form.socsoDeduction],
      ["EIS Deduction", form.eisDeduction],
      ["Tax Deduction", form.taxDeduction],
      ["Other Deduction", form.otherDeduction],
      ["OT Hours", form.otHours],
      ["OT Rate", form.otRate],
    ];

    for (const [label, value] of requiredNumbers) {
      if (value.trim() === "") return `${label} is required. Enter 0 if none.`;
      const parsed = Number(value);
      if (!Number.isFinite(parsed) || parsed < 0) return `${label} must be 0 or more.`;
    }

    return "";
  }

  async function saveEmployeePayrollLabels(employee: Employee) {
    const token = localStorage.getItem("wc_manager_token");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token || !apiBaseUrl) return;

    const response = await fetch(
      `${apiBaseUrl}/api/manager/employees/${encodeURIComponent(employee.id)}/payroll-defaults`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payrollDefaults: {
            allowanceALabel: cleanLabel(form.allowanceALabel, "Allowance A"),
            allowanceBLabel: cleanLabel(form.allowanceBLabel, "Allowance B"),
            allowanceCLabel: cleanLabel(form.allowanceCLabel, "Allowance C"),
          },
        }),
      },
    );

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || "Employee allowance labels could not be saved.");
    }
  }

  async function generatePayroll(event: FormEvent<HTMLFormElement>) {
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

    if (!selectedEmployee) {
      setError("The selected employee could not be found.");
      return;
    }

    const month = Number(form.month);
    const year = Number(form.year);

    const payroll: PayrollRecord = {
      id: `${selectedEmployee.id}_${month}_${year}`,
      companyId,
      companyCode,
      employeeId: selectedEmployee.id,
      employeeName: selectedEmployee.fullName,
      month,
      year,
      basicSalary: parseAmount(form.basicSalary),
      allowanceALabel: cleanLabel(form.allowanceALabel, "Allowance A"),
      allowanceA: parseAmount(form.allowanceA),
      allowanceBLabel: cleanLabel(form.allowanceBLabel, "Allowance B"),
      allowanceB: parseAmount(form.allowanceB),
      allowanceCLabel: cleanLabel(form.allowanceCLabel, "Allowance C"),
      allowanceC: parseAmount(form.allowanceC),
      epfDeduction: calculations.statutory.epfEmployee,
      epfEmployerContribution: calculations.statutory.epfEmployer,
      socsoDeduction: calculations.statutory.socsoEmployee,
      socsoEmployerContribution: calculations.statutory.socsoEmployer,
      eisDeduction: calculations.statutory.eisEmployee,
      eisEmployerContribution: calculations.statutory.eisEmployer,
      taxDeduction: calculations.statutory.pcbEstimate,
      otherDeduction: parseAmount(form.otherDeduction),
      otHours: parseAmount(form.otHours),
      otRate: parseAmount(form.otRate),
      status: form.status,
      remarks: form.remarks.trim(),
      useApprovedRosterOt,
    };

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      await saveEmployeePayrollLabels(selectedEmployee);

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
        throw new Error(data?.message || "Payroll could not be generated.");
      }

      setMessage(
        `${form.status === "issued" ? "Issued" : "Draft"} payroll generated successfully. Net Pay: ${money(calculations.netPay)}`,
      );
      await loadPayrollSummary();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Payroll could not be generated.",
      );
    } finally {
      setIsSaving(false);
    }
  }

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

    setIsLoadingSummary(true);
    setError("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/payroll?companyId=${encodeURIComponent(companyId)}&month=${month}&year=${year}`,
        { headers: { Authorization: `Bearer ${token}` } },
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
            <p className="mt-6 text-sm tracking-[0.35em] text-[#d4ad63]">WEDGECLOCKIN</p>
            <h1 className="mt-2 text-4xl font-bold text-[#f0dfbd]">Payroll</h1>
            <p className="mt-2 text-white/55">
              Generate and review monthly payroll from one shared employee and payroll database.
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
          <form onSubmit={generatePayroll} className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[2rem] border border-white/10 bg-[#1e2428] p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-[#f0dfbd]">Generate Payroll</h2>

              <div className="mt-6">
                <label className="text-sm text-white/55">Employee</label>
                <select
                  value={form.employeeId}
                  onChange={(event) => handleEmployeeChange(event.target.value)}
                  disabled={isLoading}
                  className={inputClassName}
                >
                  <option value="">
                    {isLoading ? "Loading employees..." : "Select an employee"}
                  </option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.fullName}
                      {employee.employeeCode ? ` (${employee.employeeCode})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <SectionTitle title="Payroll Period" />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  label="Month"
                  value={form.month}
                  onChange={(value) => updateField("month", value)}
                  options={months}
                />
                <SelectField
                  label="Year"
                  value={form.year}
                  onChange={(value) => updateField("year", value)}
                  options={years.map((year) => ({ value: String(year), label: String(year) }))}
                />
              </div>
              <SectionTitle title="Salary" />
              <MoneyField
                label="Basic Salary"
                value={form.basicSalary}
                onChange={(value) => updateField("basicSalary", value)}
              />

              <SectionTitle title="Allowances" />
              <div className="space-y-4">
                <AllowanceField
                  slotLabel="Allowance A"
                  labelValue={form.allowanceALabel}
                  amountValue={form.allowanceA}
                  onLabelChange={(value) => updateField("allowanceALabel", value)}
                  onAmountChange={(value) => updateField("allowanceA", value)}
                />
                <AllowanceField
                  slotLabel="Allowance B"
                  labelValue={form.allowanceBLabel}
                  amountValue={form.allowanceB}
                  onLabelChange={(value) => updateField("allowanceBLabel", value)}
                  onAmountChange={(value) => updateField("allowanceB", value)}
                />
                <AllowanceField
                  slotLabel="Allowance C"
                  labelValue={form.allowanceCLabel}
                  amountValue={form.allowanceC}
                  onLabelChange={(value) => updateField("allowanceCLabel", value)}
                  onAmountChange={(value) => updateField("allowanceC", value)}
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
              {approvedOtMessage && (
                <label className="mt-3 flex items-start gap-3 rounded-2xl border border-[#d4ad63]/20 bg-[#d4ad63]/5 p-4 text-xs leading-5 text-white/55">
                  <input
                    type="checkbox"
                    checked={useApprovedRosterOt}
                    onChange={(event) => setUseApprovedRosterOt(event.target.checked)}
                    className="mt-0.5 accent-[#d4ad63]"
                  />
                  <span>
                    <b className="text-[#e4c98f]">Use approved roster OT.</b>{" "}
                    {approvedOtMessage}
                  </span>
                </label>
              )}

              <SectionTitle title="Statutory / Other Deductions" />
              <div className="grid gap-3 sm:grid-cols-2">
                <StatutoryCard label="EPF" employee={calculations.statutory.epfEmployee} employer={calculations.statutory.epfEmployer} />
                <StatutoryCard label="SOCSO + SKBBK" employee={calculations.statutory.socsoEmployee} employer={calculations.statutory.socsoEmployer} />
                <StatutoryCard label="EIS" employee={calculations.statutory.eisEmployee} employer={calculations.statutory.eisEmployer} />
                <StatutoryCard label="PCB estimate" employee={calculations.statutory.pcbEstimate} />
              </div>
              <p className="mt-3 text-xs leading-5 text-white/40">Auto-calculated for Malaysian employees below 60 using current statutory bands. PCB is an annualised estimate and must be reviewed against the employee&apos;s accumulated HASiL payroll data before issue.</p>
              <div className="mt-4">
                <MoneyField label="Other Deduction" value={form.otherDeduction} onChange={(value) => updateField("otherDeduction", value)} />
              </div>

              <SectionTitle title="Payroll Status" />
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "draft" as PayrollStatus, title: "Draft", description: "Can still be amended before issuing the payslip." },
                  { value: "issued" as PayrollStatus, title: "Issued", description: "Ready for payslip printing and employee delivery." },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateField("status", option.value)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      form.status === option.value
                        ? "border-[#d4ad63]/60 bg-[#d4ad63]/10"
                        : "border-white/10 bg-[#101416] hover:border-white/20"
                    }`}
                  >
                    <p className="font-bold text-[#f0dfbd]">{option.title}</p>
                    <p className="mt-2 text-xs leading-5 text-white/45">{option.description}</p>
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <label className="text-sm text-white/55">Remarks</label>
                <textarea
                  value={form.remarks}
                  onChange={(event) => updateField("remarks", event.target.value)}
                  rows={3}
                  className={inputClassName}
                  placeholder="Optional payroll remarks"
                />
              </div>
            </section>

            <aside className="h-fit rounded-[2rem] border border-[#d4ad63]/30 bg-[#1e2428] p-6 sm:p-8 xl:sticky xl:top-8">
              <p className="text-sm tracking-[0.25em] text-[#d4ad63]">PAYROLL SUMMARY</p>
              <h2 className="mt-3 text-2xl font-bold text-[#f0dfbd]">
                {monthName(Number(form.month))} {form.year}
              </h2>
              <p className="mt-2 text-sm text-white/45">
                {selectedEmployee?.fullName ?? "Select an employee"}
              </p>

              <div className="mt-7 space-y-4">
                <SummaryRow label="Basic Salary" value={parseAmount(form.basicSalary)} />
                <SummaryRow label={cleanLabel(form.allowanceALabel, "Allowance A")} value={parseAmount(form.allowanceA)} />
                <SummaryRow label={cleanLabel(form.allowanceBLabel, "Allowance B")} value={parseAmount(form.allowanceB)} />
                <SummaryRow label={cleanLabel(form.allowanceCLabel, "Allowance C")} value={parseAmount(form.allowanceC)} />
                <SummaryRow label="OT Amount" value={calculations.otAmount} />
                <SummaryRow label="Gross Pay" value={calculations.grossPay} />
                <SummaryRow label="Total Deductions" value={calculations.totalDeductions} />
                <SummaryRow label="Net Pay" value={calculations.netPay} bold />
              </div>

              <div className="mt-7 rounded-2xl border border-white/10 bg-[#101416] p-4">
                <p className="text-xs uppercase tracking-[0.15em] text-white/35">Status</p>
                <p className="mt-2 font-semibold capitalize text-[#d4ad63]">{form.status}</p>
              </div>

              <button
                type="submit"
                disabled={isSaving || isLoading}
                className="mt-8 w-full rounded-full bg-[#d4ad63] px-8 py-4 font-bold text-[#101416] transition hover:bg-[#e4bf75] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving
                  ? "Generating Payroll..."
                  : form.status === "issued"
                    ? "Generate & Issue Payroll"
                    : "Generate Draft Payroll"}
              </button>
            </aside>
          </form>
        ) : (
          <section className="mt-8">
            <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[#1e2428] p-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm tracking-[0.25em] text-[#d4ad63]">PAYROLL PERIOD</p>
                <h2 className="mt-2 text-2xl font-bold text-[#f0dfbd]">
                  {monthName(Number(form.month))} {form.year}
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={form.month}
                  onChange={(event) => updateField("month", event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63] sm:w-44"
                  aria-label="Payroll month"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
                <select
                  value={form.year}
                  onChange={(event) => updateField("year", event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63] sm:w-32"
                  aria-label="Payroll year"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
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
                <h3 className="text-xl font-bold text-[#f0dfbd]">No payroll records saved yet</h3>
                <p className="mt-3 text-sm text-white/50">
                  Generate payroll for this month from the mobile app or the web payroll entry form.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1e2428]">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1180px] text-left text-sm">
                    <thead className="border-b border-white/10 text-white/45">
                      <tr>
                        <th className="px-5 py-4">Employee</th>
                        <th className="px-5 py-4">Status</th>
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
                        return (
                          <tr key={record.id} className="border-b border-white/5">
                            <td className="px-5 py-4">
                              <p className="font-semibold text-[#f0dfbd]">{record.employeeName}</p>
                              <p className="mt-1 text-xs text-white/35">{record.employeeId}</p>
                            </td>
                            <td className="px-5 py-4">
                              <span className="rounded-full border border-[#d4ad63]/25 bg-[#d4ad63]/10 px-3 py-1 text-xs capitalize text-[#d4ad63]">
                                {record.status ?? "draft"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-white/60">{money(record.basicSalary)}</td>
                            <td className="px-5 py-4 text-white/60">
                              <p>{record.allowanceALabel ?? "Allowance A"}: {money(record.allowanceA)}</p>
                              <p className="mt-1">{record.allowanceBLabel ?? "Allowance B"}: {money(record.allowanceB)}</p>
                              <p className="mt-1">{record.allowanceCLabel ?? "Allowance C"}: {money(record.allowanceC)}</p>
                            </td>
                            <td className="px-5 py-4 text-white/60">{record.otHours.toFixed(2)}</td>
                            <td className="px-5 py-4 text-white/60">{money(result.otAmount)}</td>
                            <td className="px-5 py-4 text-white/60">{money(result.grossPay)}</td>
                            <td className="px-5 py-4 text-white/60">{money(result.totalDeductions)}</td>
                            <td className="px-5 py-4 font-bold text-[#d4ad63]">{money(result.netPay)}</td>
                            <td className="max-w-[220px] px-5 py-4 text-white/45">{record.remarks || "—"}</td>
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
  return <h3 className="mb-3 mt-7 text-base font-bold text-[#f0dfbd]">{title}</h3>;
}

function StatutoryCard({ label, employee, employer }: { label: string; employee: number; employer?: number }) {
  return <div className="rounded-2xl border border-white/10 bg-[#101416] p-4"><p className="font-semibold text-[#f0dfbd]">{label}</p><p className="mt-2 text-sm text-white/55">Employee: <span className="font-semibold text-white/80">{money(employee)}</span></p>{employer !== undefined && <p className="mt-1 text-sm text-white/55">Employer: <span className="font-semibold text-white/80">{money(employer)}</span></p>}</div>;
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div>
      <label className="text-sm text-white/55">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function AllowanceField({
  slotLabel,
  labelValue,
  amountValue,
  onLabelChange,
  onAmountChange,
}: {
  slotLabel: string;
  labelValue: string;
  amountValue: string;
  onLabelChange: (value: string) => void;
  onAmountChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-[#101416] p-4 sm:grid-cols-[130px_minmax(0,1fr)_minmax(180px,0.65fr)] sm:items-end">
      <div>
        <p className="text-xs uppercase tracking-[0.13em] text-[#d4ad63]">{slotLabel}</p>
        <p className="mt-2 text-xs text-white/35">Editable employee label</p>
      </div>
      <div>
        <label className="text-sm text-white/55">Allowance name</label>
        <input
          type="text"
          maxLength={60}
          value={labelValue}
          onChange={(event) => onLabelChange(event.target.value)}
          className={inputClassName}
          placeholder={slotLabel}
        />
      </div>
      <MoneyField label="Amount" value={amountValue} onChange={onAmountChange} />
    </div>
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
        <span className="flex items-center border-r border-white/10 px-4 text-sm text-white/40">RM</span>
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
    <div className={`flex items-center justify-between gap-5 border-b border-white/8 pb-4 ${
      bold ? "text-lg font-bold text-[#f0dfbd]" : "text-white/55"
    }`}>
      <span className="min-w-0 break-words">{label}</span>
      <span className={`shrink-0 ${bold ? "text-[#d4ad63]" : "text-white/75"}`}>
        {money(value)}
      </span>
    </div>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none transition focus:border-[#d4ad63]";
