"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  socsoDeduction: number;
  eisDeduction: number;
  taxDeduction: number;
  otherDeduction: number;
  otHours: number;
  otRate: number;
  status?: PayrollStatus;
  remarks: string;
  createdAt?: string;
  updatedAt?: string;
};

type EmployeePayrollDefaults = {
  allowanceALabel?: string;
  allowanceBLabel?: string;
  allowanceCLabel?: string;
};

type Employee = {
  id: string;
  employeeCode?: string;
  fullName: string;
  department?: string;
  position?: string;
  payrollDefaults?: EmployeePayrollDefaults;
};

type CompanyProfile = {
  id?: string;
  companyName: string;
  registrationNumber: string;
  address: string;
  phone: string;
  outletShortName: string;
};

type PayslipCalculation = {
  otAmount: number;
  totalAllowances: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
};

const today = new Date();

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
  (_, index) => today.getFullYear() - 5 + index,
);

function calculatePayslip(record: PayrollRecord): PayslipCalculation {
  const otAmount = record.otHours * record.otRate;
  const totalAllowances =
    record.allowanceA + record.allowanceB + record.allowanceC;
  const grossPay = record.basicSalary + totalAllowances + otAmount;
  const totalDeductions =
    record.epfDeduction +
    record.socsoDeduction +
    record.eisDeduction +
    record.taxDeduction +
    record.otherDeduction;

  return {
    otAmount,
    totalAllowances,
    grossPay,
    totalDeductions,
    netPay: grossPay - totalDeductions,
  };
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

function cleanLabel(value: string | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function isMeaningfulText(value: string | undefined) {
  if (!value) return false;

  const normalized = value.trim().toLowerCase();

  return ![
    "",
    "not provided",
    "n/a",
    "na",
    "none",
    "-",
    "—",
  ].includes(normalized);
}

function issueDate(record: PayrollRecord) {
  const value = record.updatedAt || record.createdAt;
  if (!value) {
    return new Intl.DateTimeFormat("en-MY", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function PayslipsPage() {
  const router = useRouter();

  const [month, setMonth] = useState(String(today.getMonth() + 1));
  const [year, setYear] = useState(String(today.getFullYear()));
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState("");

  const [company, setCompany] = useState<CompanyProfile>({
    companyName: "",
    registrationNumber: "",
    address: "",
    phone: "",
    outletShortName: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedRecord = useMemo(
    () =>
      records.find((record) => record.id === selectedRecordId) ||
      records[0] ||
      null,
    [records, selectedRecordId],
  );

  const selectedEmployee = useMemo(
    () =>
      employees.find((employee) => employee.id === selectedRecord?.employeeId) ||
      null,
    [employees, selectedRecord],
  );

  const calculations = useMemo(
    () => (selectedRecord ? calculatePayslip(selectedRecord) : null),
    [selectedRecord],
  );

  useEffect(() => {
    async function loadCompanyAndEmployees() {
      const token = localStorage.getItem("wc_manager_token");
      const companyId = localStorage.getItem("wc_company_id");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const storedCompanyName =
        localStorage.getItem("wc_company_name") || "";
      const storedCompanyCode =
        localStorage.getItem("wc_company_code") || "";

      setCompany((current) => ({
        ...current,
        companyName: storedCompanyName,
        outletShortName: storedCompanyCode,
      }));

      if (!token || !companyId || !apiBaseUrl) return;

      try {
        const [companyResponse, employeeResponse] = await Promise.all([
          fetch(
            `${apiBaseUrl}/api/companies?companyId=${encodeURIComponent(companyId)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          ),
          fetch(
            `${apiBaseUrl}/api/employees?companyId=${encodeURIComponent(companyId)}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          ),
        ]);

        if (companyResponse.ok) {
          const companyData = await companyResponse.json();
          const companyList = Array.isArray(companyData)
            ? companyData
            : Array.isArray(companyData?.companies)
              ? companyData.companies
              : companyData?.company
                ? [companyData.company]
                : [];

          const matchedCompany = companyList.find(
            (item: CompanyProfile) => item.id === companyId,
          );

          if (matchedCompany) {
            setCompany({
              id: matchedCompany.id,
              companyName:
                matchedCompany.companyName || storedCompanyName || "Company",
              registrationNumber: matchedCompany.registrationNumber || "",
              address: matchedCompany.address || "",
              phone: matchedCompany.phone || "",
              outletShortName:
                matchedCompany.outletShortName || storedCompanyCode,
            });
          }
        }

        if (employeeResponse.ok) {
          const employeeData = await employeeResponse.json();
          setEmployees(
            Array.isArray(employeeData)
              ? employeeData
              : Array.isArray(employeeData?.employees)
                ? employeeData.employees
                : [],
          );
        }
      } catch {
        // Keep the payslip usable with payroll data and local session details.
      }
    }

    loadCompanyAndEmployees();
  }, []);

  useEffect(() => {
    async function loadPayslips() {
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

      const numericMonth = Number(month);
      const numericYear = Number(year);

      if (
        !Number.isInteger(numericMonth) ||
        numericMonth < 1 ||
        numericMonth > 12
      ) {
        setError("Please select a valid month.");
        setIsLoading(false);
        return;
      }

      if (
        !Number.isInteger(numericYear) ||
        numericYear < 2020 ||
        numericYear > 2100
      ) {
        setError("Please select a valid year.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${apiBaseUrl}/api/payroll?companyId=${encodeURIComponent(
            companyId,
          )}&month=${numericMonth}&year=${numericYear}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message || "Payslip records could not be loaded.",
          );
        }

        const payrollRecords: PayrollRecord[] = Array.isArray(data) ? data : [];
        setRecords(payrollRecords);

        setSelectedRecordId((current) =>
          current &&
          payrollRecords.some((record) => record.id === current)
            ? current
            : payrollRecords[0]?.id || "",
        );
      } catch (loadError) {
        setRecords([]);
        setSelectedRecordId("");
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Payslip records could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadPayslips();
  }, [month, year, router]);

  function printPayslip() {
    if (selectedRecord) window.print();
  }

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }

        @media print {
          html,
          body {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .print-area,
          .print-area * {
            visibility: visible !important;
          }

          .no-print {
            display: none !important;
          }

          .print-area {
            position: absolute !important;
            inset: 0 auto auto 0 !important;
            width: 194mm !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: #111 !important;
            overflow: visible !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-area * {
            color: #111 !important;
            border-color: #d1d5db !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .print-compact-header {
            padding: 12px 22px !important;
          }

          .print-compact-section {
            padding: 10px 22px !important;
          }

          .print-compact-grid {
            gap: 12px !important;
          }

          .print-compact-net {
            margin: 0 22px 10px !important;
            padding: 12px 16px !important;
          }

          .print-compact-footer {
            padding: 10px 22px !important;
          }
        }
      `}</style>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <header className="no-print flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
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
              Payslips
            </h1>

            <p className="mt-2 text-white/55">
              Review, print and save professional employee payslips.
            </p>
          </div>

          <button
            type="button"
            onClick={printPayslip}
            disabled={!selectedRecord}
            className="rounded-full bg-[#d4ad63] px-7 py-3 font-bold text-[#101416] transition hover:bg-[#e4bf75] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Print / Save PDF
          </button>
        </header>

        <section className="no-print mt-8 rounded-[2rem] border border-white/10 bg-[#1e2428] p-6">
          <div className="grid gap-4 md:grid-cols-[180px_150px_minmax(0,1fr)]">
            <label>
              <span className="text-sm text-white/55">Month</span>
              <select
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className={inputClassName}
              >
                {months.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm text-white/55">Year</span>
              <select
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className={inputClassName}
              >
                {years.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm text-white/55">Employee</span>
              <select
                value={selectedRecord?.id || ""}
                onChange={(event) =>
                  setSelectedRecordId(event.target.value)
                }
                disabled={records.length === 0}
                className={inputClassName}
              >
                {records.length === 0 ? (
                  <option value="">No payroll records</option>
                ) : (
                  records.map((record) => (
                    <option key={record.id} value={record.id}>
                      {record.employeeName}
                    </option>
                  ))
                )}
              </select>
            </label>
          </div>
        </section>

        {error ? (
          <div className="no-print mt-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="no-print mt-6 rounded-[2rem] border border-white/10 bg-[#1e2428] p-12 text-center text-white/55">
            Loading payslip records...
          </div>
        ) : !selectedRecord || !calculations ? (
          <div className="no-print mt-6 rounded-[2rem] border border-white/10 bg-[#1e2428] p-12 text-center">
            <h2 className="text-xl font-bold text-[#f0dfbd]">
              No payslip available
            </h2>
            <p className="mt-3 text-sm text-white/50">
              Generate payroll for this employee and month before printing a payslip.
            </p>
            <button
              type="button"
              onClick={() => router.push("/manager-dashboard/payroll")}
              className="mt-6 rounded-full border border-[#d4ad63]/50 px-6 py-3 font-semibold text-[#f0dfbd] hover:bg-white/5"
            >
              Open Payroll
            </button>
          </div>
        ) : (
          <PayslipDocument
            company={company}
            employee={selectedEmployee}
            record={selectedRecord}
            calculations={calculations}
          />
        )}
      </section>
    </main>
  );
}

function PayslipDocument({
  company,
  employee,
  record,
  calculations,
}: {
  company: CompanyProfile;
  employee: Employee | null;
  record: PayrollRecord;
  calculations: PayslipCalculation;
}) {
  return (
    <article className="print-area mx-auto mt-8 max-w-4xl overflow-hidden rounded-[2rem] border border-[#d4ad63]/30 bg-[#f4efe6] text-[#211d17] shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
      <header className="print-compact-header border-b border-[#211d17]/15 bg-[#e8ddc9] px-8 py-6 sm:px-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold tracking-[0.28em] text-[#806431]">
              EMPLOYEE PAYSLIP
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              {company.companyName || company.outletShortName || "Company"}
            </h2>

            {isMeaningfulText(company.registrationNumber) ? (
              <p className="mt-1 text-xs text-[#211d17]/60">
                Registration No.: {company.registrationNumber}
              </p>
            ) : null}

            {isMeaningfulText(company.address) ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-5 text-[#211d17]/65">
                {company.address}
              </p>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#211d17]/60">
              {isMeaningfulText(company.phone) ? (
                <span>Tel: {company.phone}</span>
              ) : null}

              {isMeaningfulText(company.outletShortName) ? (
                <span>Company Code: {company.outletShortName}</span>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 sm:text-right">
            <p className="text-xs uppercase tracking-[0.14em] text-[#211d17]/45">
              Payroll Period
            </p>
            <p className="mt-1 text-xl font-bold">
              {monthName(record.month)} {record.year}
            </p>

          </div>
        </div>
      </header>

      <section className="print-compact-section print-compact-grid grid gap-4 border-b border-[#211d17]/15 px-8 py-5 sm:grid-cols-3 sm:px-10">
        <PayslipMeta label="Employee Name" value={record.employeeName} />
        <PayslipMeta
          label="Employee No."
          value={employee?.employeeCode || record.employeeId}
        />
        <PayslipMeta label="Issue Date" value={issueDate(record)} />
        <PayslipMeta
          label="Department"
          value={
            isMeaningfulText(employee?.department)
              ? employee?.department || ""
              : "—"
          }
        />
        <PayslipMeta
          label="Position"
          value={
            isMeaningfulText(employee?.position)
              ? employee?.position || ""
              : "—"
          }
        />
        <PayslipMeta label="Payslip Reference" value={record.id} />
      </section>

      <section className="print-compact-section print-compact-grid grid gap-7 px-8 py-6 sm:grid-cols-2 sm:px-10">
        <div>
          <PayslipSectionTitle title="Earnings" />
          <div className="mt-3 space-y-2.5">
            <PayslipRow label="Basic Salary" value={record.basicSalary} />
            <PayslipRow
              label={cleanLabel(
                record.allowanceALabel,
                cleanLabel(
                  employee?.payrollDefaults?.allowanceALabel,
                  "Allowance A",
                ),
              )}
              value={record.allowanceA}
            />
            <PayslipRow
              label={cleanLabel(
                record.allowanceBLabel,
                cleanLabel(
                  employee?.payrollDefaults?.allowanceBLabel,
                  "Allowance B",
                ),
              )}
              value={record.allowanceB}
            />
            <PayslipRow
              label={cleanLabel(
                record.allowanceCLabel,
                cleanLabel(
                  employee?.payrollDefaults?.allowanceCLabel,
                  "Allowance C",
                ),
              )}
              value={record.allowanceC}
            />
            <PayslipRow
              label={`Overtime (${record.otHours.toFixed(2)} hrs × ${money(
                record.otRate,
              )})`}
              value={calculations.otAmount}
            />
            <PayslipTotalRow
              label="Gross Pay"
              value={calculations.grossPay}
            />
          </div>
        </div>

        <div>
          <PayslipSectionTitle title="Deductions" />
          <div className="mt-3 space-y-2.5">
            <PayslipRow label="EPF" value={record.epfDeduction} />
            <PayslipRow label="SOCSO" value={record.socsoDeduction} />
            <PayslipRow label="EIS" value={record.eisDeduction} />
            <PayslipRow label="PCB / Tax" value={record.taxDeduction} />
            <PayslipRow
              label="Other Deduction"
              value={record.otherDeduction}
            />
            <PayslipTotalRow
              label="Total Deductions"
              value={calculations.totalDeductions}
            />
          </div>
        </div>
      </section>

      <section className="print-compact-net mx-8 mb-5 rounded-2xl border border-[#806431]/25 bg-[#e8ddc9] p-5 sm:mx-10">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#806431]">
              NET PAY
            </p>
            <p className="mt-1 text-xs text-[#211d17]/55">
              Final amount payable to employee
            </p>
          </div>
          <p className="shrink-0 text-3xl font-bold text-[#806431]">
            {money(calculations.netPay)}
          </p>
        </div>
      </section>

      {record.remarks ? (
        <section className="print-compact-section border-t border-[#211d17]/15 px-8 py-4 sm:px-10">
          <p className="text-[11px] font-bold tracking-[0.16em] text-[#806431]">
            REMARKS
          </p>
          <p className="mt-2 text-xs leading-5 text-[#211d17]/65">
            {record.remarks}
          </p>
        </section>
      ) : null}

      <section className="print-compact-section grid gap-8 border-t border-[#211d17]/15 px-8 py-5 sm:grid-cols-2 sm:px-10">
        <div>
          <div className="mt-8 w-48 border-t border-[#211d17]/45" />
          <p className="mt-2 text-xs font-semibold">Manager Signature</p>
        </div>

        <div className="sm:text-right">
          <p className="text-[11px] font-bold tracking-[0.18em] text-[#806431]">
            GENERATED BY WEDGECLOCKIN
          </p>
          <p className="mt-2 text-xs leading-5 text-[#211d17]/50">
            This is a computer-generated payslip.
            <br />
            Please contact management if clarification is required.
          </p>
        </div>
      </section>

      <footer className="print-compact-footer border-t border-[#211d17]/15 px-8 py-4 text-center text-[10px] leading-4 text-[#211d17]/40 sm:px-10">
        Confidential payroll document for the named employee and stated payroll period.
      </footer>
    </article>
  );
}

function PayslipMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[#806431]">
        {label}
      </p>
      <p className="mt-1 break-all text-sm font-semibold">{value}</p>
    </div>
  );
}

function PayslipSectionTitle({ title }: { title: string }) {
  return (
    <h3 className="border-b border-[#211d17]/15 pb-2 text-base font-bold">
      {title}
    </h3>
  );
}

function PayslipRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-start justify-between gap-5">
      <span className="text-xs leading-5 text-[#211d17]/60">
        {label}
      </span>
      <span className="shrink-0 text-xs font-semibold">
        {money(value)}
      </span>
    </div>
  );
}

function PayslipTotalRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-5 border-t border-[#211d17]/15 pt-3">
      <span className="text-sm font-bold">{label}</span>
      <span className="text-sm font-bold text-[#806431]">
        {money(value)}
      </span>
    </div>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]";
