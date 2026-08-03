"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculateMalaysiaStatutory } from "../../lib/malaysiaStatutory";
import { expireManagerSession } from "../../lib/managerSession";

type Payroll = { employeeId: string; employeeName: string; month: number; year: number; basicSalary: number; allowanceA: number; allowanceB: number; allowanceC: number; monthlyIncentive?: number; otHours: number; otRate: number; otPay?: number; taxDeduction: number; otherDeduction: number };
type Employee = { id: string; epfMemberNumber?: string; icNumber?: string; employeeCode?: string; fullName: string };

function csvCell(value: unknown) { return `"${String(value ?? "").replaceAll('"', '""')}"`; }
function cents(value: number, width: number) { return String(Math.round(value * 100)).padStart(width, "0").slice(-width); }
function fixed(value: string, width: number) { return value.replace(/[^A-Za-z0-9 .&()/-]/g, "").slice(0, width).padEnd(width, " "); }
function downloadFile(name: string, content: string, type: string) { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url); }

export default function ExportPage() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [employerCode, setEmployerCode] = useState("");
  const [ssmNumber, setSsmNumber] = useState("");
  const [working, setWorking] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    const api = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = localStorage.getItem("wc_manager_token");
    const companyId = localStorage.getItem("wc_company_id");
    if (!api || !token || !companyId) throw new Error("Manager session has expired.");
    const headers = { Authorization: `Bearer ${token}` };
    const [payrollResponse, employeesResponse] = await Promise.all([
      fetch(`${api}/api/payroll?companyId=${encodeURIComponent(companyId)}&month=${month}&year=${year}`, { headers }),
      fetch(`${api}/api/manager/employees`, { headers }),
    ]);
    if (
      expireManagerSession(payrollResponse) ||
      expireManagerSession(employeesResponse)
    ) {
      throw new Error("Your manager session has expired.");
    }
    if (!payrollResponse.ok || !employeesResponse.ok) throw new Error("Payroll or employee records could not be loaded.");
    const payroll: Payroll[] = await payrollResponse.json();
    const employeeData = await employeesResponse.json();
    if (!payroll.length) throw new Error("No payroll records exist for this month.");
    return { payroll, employees: (employeeData.employees || []) as Employee[] };
  }

  async function run(kind: "payroll" | "epf" | "perkeso") {
    setWorking(kind); setError("");
    try {
      const { payroll, employees } = await loadData();
      const people = new Map(employees.map((employee) => [employee.id, employee]));
      const rows = payroll.map((record) => {
        const epfWages = record.basicSalary + record.allowanceA + record.allowanceB + record.allowanceC + Number(record.monthlyIncentive || 0);
        const gross = epfWages + Number(record.otPay ?? record.otHours * record.otRate);
        return { record, employee: people.get(record.employeeId), gross, statutory: calculateMalaysiaStatutory(epfWages, gross) };
      });
      const period = `${year}-${month.padStart(2, "0")}`;

      if (kind === "payroll") {
        const header = ["Employee Code","IC Number","Employee Name","Contribution Wages","EPF Employee","EPF Employer","SOCSO Employee incl SKBBK","SOCSO Employer","EIS Employee","EIS Employer","PCB","Other Deduction","Net Pay"];
        const lines = rows.map(({ record, employee, gross, statutory }) => [employee?.employeeCode, employee?.icNumber, record.employeeName, gross.toFixed(2), statutory.epfEmployee.toFixed(2), statutory.epfEmployer.toFixed(2), statutory.socsoEmployee.toFixed(2), statutory.socsoEmployer.toFixed(2), statutory.eisEmployee.toFixed(2), statutory.eisEmployer.toFixed(2), record.taxDeduction.toFixed(2), record.otherDeduction.toFixed(2), (gross - statutory.epfEmployee - statutory.socsoEmployee - statutory.eisEmployee - record.taxDeduction - record.otherDeduction).toFixed(2)].map(csvCell).join(","));
        downloadFile(`wedge-payroll-${period}.csv`, [header.map(csvCell).join(","), ...lines].join("\r\n"), "text/csv;charset=utf-8");
      }

      if (kind === "epf") {
        const missing = rows.filter(({ employee }) => !employee?.icNumber);
        if (missing.length) throw new Error(`${missing.length} employee(s) are missing an IC number.`);
        const header = ["MEMBER_NUMBER","IC_NUMBER","EMPLOYEE_NAME","EPF_WAGES","EMPLOYER_CONTRIBUTION","EMPLOYEE_CONTRIBUTION","TOTAL_CONTRIBUTION"];
        const lines = rows.map(({ record, employee, statutory }) => [employee?.epfMemberNumber?.replace(/\D/g, "") || "", employee?.icNumber?.replace(/\D/g, ""), record.employeeName, statutory.epfContributionWages.toFixed(2), statutory.epfEmployer.toFixed(2), statutory.epfEmployee.toFixed(2), (statutory.epfEmployer + statutory.epfEmployee).toFixed(2)].map(csvCell).join(","));
        downloadFile(`epf-e-caruman-${period}.csv`, [header.map(csvCell).join(","), ...lines].join("\r\n"), "text/csv;charset=utf-8");
      }

      if (kind === "perkeso") {
        if (!employerCode.trim()) throw new Error("Enter the 12-character PERKESO employer code.");
        const missing = rows.filter(({ employee }) => !employee?.icNumber);
        if (missing.length) throw new Error(`${missing.length} employee(s) are missing an IC number.`);
        const contributionMonth = `${month.padStart(2, "0")}${year}`;
        const lines = rows.map(({ record, employee, gross, statutory }) => [fixed(employerCode,12), fixed(ssmNumber,20), fixed(employee?.icNumber?.replace(/\D/g, "") || "",12), fixed(record.employeeName,150), contributionMonth, cents(gross,14), cents(statutory.socsoEmployer,6), cents(statutory.socsoInvalidityEmployee,6), cents(statutory.eisEmployer,6), cents(statutory.eisEmployee,6), cents(statutory.skbbkEmployee,6), "".padEnd(14," "), "".padEnd(20," ")].join(""));
        downloadFile(`${employerCode.trim()}-${contributionMonth}.txt`, lines.join("\r\n"), "text/plain;charset=utf-8");
      }
    } catch (err) { setError(err instanceof Error ? err.message : "Export failed."); }
    finally { setWorking(""); }
  }

  return <main className="min-h-screen bg-[#101416] text-[#f4efe6]"><section className="mx-auto max-w-6xl px-6 py-10">
    <button onClick={() => router.push("/manager-dashboard")} className="text-[#d4ad63] hover:underline">← Back to Manager Dashboard</button>
    <p className="mt-8 text-sm tracking-[0.35em] text-[#d4ad63]">STATUTORY PAYROLL CENTRE</p><h1 className="mt-3 text-4xl font-bold text-[#f0dfbd]">EPF, SOCSO, EIS & PCB</h1><p className="mt-3 max-w-3xl text-white/60">Calculate and export contributions for Malaysian employees below 60.</p>
    <div className="mt-8 grid gap-4 rounded-[2rem] border border-white/10 bg-[#1d2327] p-6 md:grid-cols-4"><Field label="Month" value={month} onChange={setMonth} type="number"/><Field label="Year" value={year} onChange={setYear} type="number"/><Field label="PERKESO Employer Code" value={employerCode} onChange={setEmployerCode}/><Field label="SSM / MyCoID" value={ssmNumber} onChange={setSsmNumber}/></div>
    {error && <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{error}</div>}
    <div className="mt-8 grid gap-5 md:grid-cols-3"><ExportCard title="Payroll Statutory CSV" text="Full payroll, employee and employer contribution breakdown." busy={working === "payroll"} onClick={() => run("payroll")}/><ExportCard title="EPF e-Caruman CSV" text="EPF wage and contribution schedule for e-Caruman review/import." busy={working === "epf"} onClick={() => run("epf")}/><ExportCard title="PERKESO ASSIST 2.0" text="Official 278-character combined SOCSO, EIS and SKBBK text layout." busy={working === "perkeso"} onClick={() => run("perkeso")}/></div>
    <div className="mt-8 rounded-[2rem] border border-amber-400/25 bg-amber-500/10 p-6 text-sm leading-6 text-amber-100/80"><strong>Submission check:</strong> validate employer codes, IC numbers, contribution categories and PCB against the official portals before payment. EPF may require approval or mapping of a payroll provider&apos;s CSV layout.</div>
  </section></main>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="text-sm text-white/55">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]"/></label>; }
function ExportCard({ title, text, busy, onClick }: { title: string; text: string; busy: boolean; onClick: () => void }) { return <article className="rounded-[2rem] border border-[#d4ad63]/25 bg-[#1d2327] p-6"><h2 className="text-xl font-bold text-[#f0dfbd]">{title}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-white/55">{text}</p><button disabled={busy} onClick={onClick} className="mt-6 rounded-full bg-[#d4ad63] px-5 py-3 font-bold text-[#101416] disabled:opacity-50">{busy ? "Preparing…" : "Download"}</button></article>; }
