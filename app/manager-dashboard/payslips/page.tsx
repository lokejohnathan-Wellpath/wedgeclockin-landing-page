"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

type PayslipCalculation = {
  otAmount: number;
  totalAllowances: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
};

const today = new Date();

function calculatePayslip(record: PayrollRecord): PayslipCalculation {
  const otAmount = record.otHours * record.otRate;

  const totalAllowances =
    record.allowanceA +
    record.allowanceB +
    record.allowanceC;

  const grossPay =
    record.basicSalary +
    totalAllowances +
    otAmount;

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
  return new Intl.DateTimeFormat("en-MY", {
    month: "long",
  }).format(new Date(2026, month - 1, 1));
}

export default function PayslipsPage() {
  const router = useRouter();

  const [month, setMonth] = useState(
    String(today.getMonth() + 1),
  );
  const [year, setYear] = useState(
    String(today.getFullYear()),
  );

  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState("");

  const [companyName, setCompanyName] = useState("");
  const [companyCode, setCompanyCode] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedRecord = useMemo(
    () =>
      records.find(
        (record) => record.id === selectedRecordId,
      ) || records[0] || null,
    [records, selectedRecordId],
  );

  const calculations = useMemo(
    () =>
      selectedRecord
        ? calculatePayslip(selectedRecord)
        : null,
    [selectedRecord],
  );

  useEffect(() => {
    const storedCompanyName =
      localStorage.getItem("wc_company_name") || "";

    const storedCompanyCode =
      localStorage.getItem("wc_company_code") || "";

    setCompanyName(storedCompanyName);
    setCompanyCode(storedCompanyCode);
  }, []);

  useEffect(() => {
    async function loadPayslips() {
      const token = localStorage.getItem("wc_manager_token");
      const companyId = localStorage.getItem("wc_company_id");
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL;

      if (!token) {
        router.push("/manager-login");
        return;
      }

      if (!companyId || !apiBaseUrl) {
        setError(
          "Company session or API service is unavailable.",
        );
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
        setError("Month must be between 1 and 12.");
        setIsLoading(false);
        return;
      }

      if (
        !Number.isInteger(numericYear) ||
        numericYear < 2020 ||
        numericYear > 2100
      ) {
        setError("Please enter a valid year.");
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
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Payslip records could not be loaded.",
          );
        }

        const payrollRecords: PayrollRecord[] =
          Array.isArray(data) ? data : [];

        setRecords(payrollRecords);

        setSelectedRecordId((current) => {
          if (
            current &&
            payrollRecords.some(
              (record) => record.id === current,
            )
          ) {
            return current;
          }

          return payrollRecords[0]?.id || "";
        });
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
    if (!selectedRecord) {
      return;
    }

    window.print();
  }

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-area {
            margin: 0 !important;
            max-width: none !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: #111 !important;
          }

          .print-area * {
            color: #111 !important;
            border-color: #d1d5db !important;
          }
        }
      `}</style>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <header className="no-print flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push("/manager-dashboard")
              }
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
              Review and print employee payslips from saved
              payroll records.
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
          <div className="grid gap-4 md:grid-cols-[140px_160px_minmax(0,1fr)]">
            <label>
              <span className="text-sm text-white/55">
                Month
              </span>

              <input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(event) =>
                  setMonth(event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label>
              <span className="text-sm text-white/55">
                Year
              </span>

              <input
                type="number"
                min="2020"
                max="2100"
                value={year}
                onChange={(event) =>
                  setYear(event.target.value)
                }
                className={inputClassName}
              />
            </label>

            <label>
              <span className="text-sm text-white/55">
                Employee
              </span>

              <select
                value={selectedRecord?.id || ""}
                onChange={(event) =>
                  setSelectedRecordId(event.target.value)
                }
                disabled={records.length === 0}
                className={inputClassName}
              >
                {records.length === 0 ? (
                  <option value="">
                    No payroll records
                  </option>
                ) : (
                  records.map((record) => (
                    <option
                      key={record.id}
                      value={record.id}
                    >
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
              Save payroll for this employee and month before
              generating a payslip.
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/manager-dashboard/payroll",
                )
              }
              className="mt-6 rounded-full border border-[#d4ad63]/50 px-6 py-3 font-semibold text-[#f0dfbd] hover:bg-white/5"
            >
              Open Payroll
            </button>
          </div>
        ) : (
          <PayslipDocument
            companyName={
              companyName ||
              companyCode ||
              "Company"
            }
            companyCode={companyCode}
            record={selectedRecord}
            calculations={calculations}
          />
        )}
      </section>
    </main>
  );
}

function PayslipDocument({
  companyName,
  companyCode,
  record,
  calculations,
}: {
  companyName: string;
  companyCode: string;
  record: PayrollRecord;
  calculations: PayslipCalculation;
}) {
  return (
    <article className="print-area mx-auto mt-8 max-w-4xl overflow-hidden rounded-[2rem] border border-[#d4ad63]/30 bg-[#f4efe6] text-[#211d17] shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
      <header className="border-b border-[#211d17]/15 bg-[#e8ddc9] px-8 py-7 sm:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.28em] text-[#806431]">
              WEDGECLOCKIN PAYSLIP
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {companyName}
            </h2>

            {companyCode ? (
              <p className="mt-2 text-sm text-[#211d17]/60">
                Company Code: {companyCode}
              </p>
            ) : null}
          </div>

          <div className="sm:text-right">
            <p className="text-sm text-[#211d17]/55">
              Payroll Period
            </p>

            <p className="mt-1 text-xl font-bold">
              {monthName(record.month)} {record.year}
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-5 border-b border-[#211d17]/15 px-8 py-7 sm:grid-cols-2 sm:px-10">
        <PayslipMeta
          label="Employee Name"
          value={record.employeeName}
        />

        <PayslipMeta
          label="Employee ID"
          value={record.employeeId}
        />

        <PayslipMeta
          label="Payslip Reference"
          value={record.id}
        />

        <PayslipMeta
          label="Payroll Status"
          value="Saved"
        />
      </section>

      <section className="grid gap-8 px-8 py-8 sm:grid-cols-2 sm:px-10">
        <div>
          <PayslipSectionTitle title="Earnings" />

          <div className="mt-4 space-y-3">
            <PayslipRow
              label="Basic Salary"
              value={record.basicSalary}
            />

            <PayslipRow
              label="Allowance A"
              value={record.allowanceA}
            />

            <PayslipRow
              label="Allowance B"
              value={record.allowanceB}
            />

            <PayslipRow
              label="Allowance C"
              value={record.allowanceC}
            />

            <PayslipRow
              label={`Overtime (${record.otHours.toFixed(
                2,
              )} hrs × ${money(record.otRate)})`}
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

          <div className="mt-4 space-y-3">
            <PayslipRow
              label="EPF"
              value={record.epfDeduction}
            />

            <PayslipRow
              label="SOCSO"
              value={record.socsoDeduction}
            />

            <PayslipRow
              label="EIS"
              value={record.eisDeduction}
            />

            <PayslipRow
              label="Tax"
              value={record.taxDeduction}
            />

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

      <section className="mx-8 mb-8 rounded-2xl border border-[#806431]/25 bg-[#e8ddc9] p-6 sm:mx-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[#806431]">
              NET PAY
            </p>

            <p className="mt-2 text-sm text-[#211d17]/55">
              Final amount payable to employee
            </p>
          </div>

          <p className="text-3xl font-bold text-[#806431]">
            {money(calculations.netPay)}
          </p>
        </div>
      </section>

      {record.remarks ? (
        <section className="border-t border-[#211d17]/15 px-8 py-6 sm:px-10">
          <p className="text-xs font-bold tracking-[0.16em] text-[#806431]">
            REMARKS
          </p>

          <p className="mt-3 text-sm leading-6 text-[#211d17]/65">
            {record.remarks}
          </p>
        </section>
      ) : null}

      <footer className="border-t border-[#211d17]/15 px-8 py-6 text-xs leading-5 text-[#211d17]/45 sm:px-10">
        This payslip was generated from the company&apos;s
        saved payroll record. Please contact management if
        any information requires clarification.
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
      <p className="text-xs font-bold uppercase tracking-[0.13em] text-[#806431]">
        {label}
      </p>

      <p className="mt-2 break-all font-semibold">
        {value}
      </p>
    </div>
  );
}

function PayslipSectionTitle({
  title,
}: {
  title: string;
}) {
  return (
    <h3 className="border-b border-[#211d17]/15 pb-3 text-lg font-bold">
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
      <span className="text-sm text-[#211d17]/60">
        {label}
      </span>

      <span className="shrink-0 text-sm font-semibold">
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
    <div className="mt-4 flex items-center justify-between gap-5 border-t border-[#211d17]/15 pt-4">
      <span className="font-bold">{label}</span>

      <span className="font-bold text-[#806431]">
        {money(value)}
      </span>
    </div>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]";