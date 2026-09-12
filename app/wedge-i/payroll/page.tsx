"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { founderRequest } from "../../lib/founderApi";

type PayrollRow = {
  id: string;
  employeeId: string;
  employeeName: string;
  status: "draft" | "issued";
  basicSalary: number;
  allowanceA: number;
  allowanceB: number;
  allowanceC: number;
  monthlyIncentive: number;
  otPay: number;
  unpaidLeaveDeduction: number;
  epfDeduction: number;
  epfEmployerContribution: number;
  socsoDeduction: number;
  socsoEmployerContribution: number;
  eisDeduction: number;
  eisEmployerContribution: number;
  taxDeduction: number;
  otherDeduction: number;
  attendanceDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  lateMinutes: number;
  remarks?: string;
  isAdjustment?: boolean;
};

type PayrollResponse = {
  success: true;
  business: { businessId: string; companyCode: string; name: string };
  period: string;
  payroll: PayrollRow[];
};

const fieldClass = "w-full rounded-lg border border-white/10 bg-[#0c1114] px-3 py-2 text-right text-sm text-white outline-none focus:border-[#c8a467] disabled:opacity-60";

function periodNow() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value || 0);
}

function employmentCost(row: PayrollRow) {
  return row.basicSalary + row.allowanceA + row.allowanceB + row.allowanceC + row.monthlyIncentive + row.otPay - row.unpaidLeaveDeduction + row.epfEmployerContribution + row.socsoEmployerContribution + row.eisEmployerContribution;
}

function netPay(row: PayrollRow) {
  const gross = row.basicSalary + row.allowanceA + row.allowanceB + row.allowanceC + row.monthlyIncentive + row.otPay - row.unpaidLeaveDeduction;
  return gross - row.epfDeduction - row.socsoDeduction - row.eisDeduction - row.taxDeduction - row.otherDeduction;
}

export default function FounderPayrollWorkspace() {
  const [businessId, setBusinessId] = useState("");
  const [period, setPeriod] = useState(periodNow());
  const [companyName, setCompanyName] = useState("");
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => setBusinessId(new URLSearchParams(window.location.search).get("businessId") || ""), []);

  async function load(id = businessId, selectedPeriod = period) {
    if (!id) return;
    setLoading(true); setError("");
    try {
      const result = await founderRequest<PayrollResponse>(`/api/founder/control/businesses/${encodeURIComponent(id)}/payroll?period=${encodeURIComponent(selectedPeriod)}`);
      setRows(result.payroll || []);
      setCompanyName(result.business.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Payroll could not be loaded.");
    } finally { setLoading(false); }
  }

  useEffect(() => { if (businessId) void load(); }, [businessId, period]); // eslint-disable-line react-hooks/exhaustive-deps

  const baseRows = useMemo(() => rows.filter((row) => !row.isAdjustment), [rows]);
  const draftCount = baseRows.filter((row) => row.status !== "issued").length;
  const totalEmploymentCost = baseRows.reduce((sum, row) => sum + employmentCost(row), 0);

  function changeNumber(id: string, field: keyof PayrollRow, value: string) {
    const number = Math.max(0, Number(value || 0));
    setRows((current) => current.map((row) => row.id === id ? { ...row, [field]: Number.isFinite(number) ? number : 0 } : row));
  }

  async function generate() {
    if (!businessId) return;
    setGenerating(true); setError(""); setMessage("");
    try {
      const result = await founderRequest<{ success: true; message: string }>(`/api/founder/control/businesses/${encodeURIComponent(businessId)}/payroll/generate`, { method: "POST", body: JSON.stringify({ period }) });
      setMessage(result.message);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Payroll drafts could not be generated."); }
    finally { setGenerating(false); }
  }

  async function save(row: PayrollRow, issue = false) {
    if (row.status === "issued") return;
    setBusyId(row.id); setError(""); setMessage("");
    try {
      const payload = {
        basicSalary: row.basicSalary,
        allowanceA: row.allowanceA,
        allowanceB: row.allowanceB,
        allowanceC: row.allowanceC,
        monthlyIncentive: row.monthlyIncentive,
        otPay: row.otPay,
        epfDeduction: row.epfDeduction,
        epfEmployerContribution: row.epfEmployerContribution,
        socsoDeduction: row.socsoDeduction,
        socsoEmployerContribution: row.socsoEmployerContribution,
        eisDeduction: row.eisDeduction,
        eisEmployerContribution: row.eisEmployerContribution,
        taxDeduction: row.taxDeduction,
        otherDeduction: row.otherDeduction,
        remarks: row.remarks || "",
        ...(issue ? { status: "issued" } : {}),
      };
      const result = await founderRequest<{ success: true; payroll: PayrollRow; message: string }>(`/api/founder/control/businesses/${encodeURIComponent(businessId)}/payroll/${encodeURIComponent(row.id)}`, { method: "PUT", body: JSON.stringify(payload) });
      setRows((current) => current.map((item) => item.id === row.id ? result.payroll : item));
      setMessage(result.message);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Payroll could not be saved."); }
    finally { setBusyId(""); }
  }

  if (!businessId) return <main className="grid min-h-screen place-items-center bg-[#090d10] px-6 text-center text-[#f4efe6]"><div><h1 className="text-3xl font-semibold text-[#f0dfbd]">Select a managed business first</h1><Link href="/founder-john-control/businesses" className="mt-6 inline-flex rounded-full bg-[#c8a467] px-6 py-3 font-bold text-[#111416]">Managed Businesses</Link></div></main>;

  return (
    <main className="min-h-screen bg-[#090d10] px-5 py-8 text-[#f4efe6] sm:px-8">
      <div className="mx-auto max-w-[1500px]">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-white/10 pb-7">
          <div><Link href={`/wedge-i?businessId=${encodeURIComponent(businessId)}`} className="text-sm font-semibold text-[#c8a467]">← Business Workspace</Link><p className="mt-5 text-xs font-bold tracking-[.22em] text-[#c8a467]">WEDGECLOCKIN → WEDGE-I</p><h1 className="mt-2 text-4xl font-semibold text-[#f0dfbd]">Month-end payroll review</h1><p className="mt-3 text-sm text-white/45">{companyName || businessId}. Automatic drafts feed the working P&amp;L; issue every employee payroll before final month close.</p></div>
          <div className="flex flex-wrap items-center gap-2"><input type="month" value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-xl border border-white/10 bg-[#11171b] px-4 py-3 text-sm text-white" /><button onClick={() => void generate()} disabled={generating} className="rounded-xl bg-[#c8a467] px-5 py-3 text-sm font-bold text-[#111416] disabled:opacity-50">{generating ? "Generating…" : "Generate Missing Drafts"}</button></div>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-3"><Metric label="Employees / payroll rows" value={String(baseRows.length)} /><Metric label="Drafts needing review" value={String(draftCount)} warn={draftCount > 0} /><Metric label="Total employer staff cost" value={money(totalEmploymentCost)} /></section>
        {error ? <p className="mt-5 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">{error}</p> : null}
        {message ? <p className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{message}</p> : null}

        <div className="mt-7 space-y-5">
          {loading ? <div className="rounded-[26px] border border-white/10 bg-[#11171b] p-8 text-center text-white/45">Loading payroll…</div> : null}
          {!loading && !baseRows.length ? <div className="rounded-[26px] border border-dashed border-white/10 bg-[#11171b] p-8 text-center text-white/45">No payroll rows yet. Generate the month-end drafts from WedgeCLOCKin attendance, roster, OT and leave records.</div> : null}
          {baseRows.map((row) => {
            const issued = row.status === "issued";
            return <article key={row.id} className="overflow-hidden rounded-[26px] border border-white/10 bg-[#11171b]">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6"><div><h2 className="font-bold text-[#f0dfbd]">{row.employeeName}</h2><p className="mt-1 text-xs text-white/35">Attendance {row.attendanceDays} day(s) · Paid leave {row.paidLeaveDays} · Unpaid leave {row.unpaidLeaveDays} · Late {row.lateMinutes} min</p></div><span className={`rounded-full px-3 py-2 text-xs font-bold ${issued ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-300/10 text-amber-100"}`}>{issued ? "ISSUED · LOCKED" : "DRAFT · REVIEW"}</span></div>
              <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1.3fr_.7fr]">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <NumberField label="Basic salary" value={row.basicSalary} disabled={issued} onChange={(value)=>changeNumber(row.id,"basicSalary",value)} />
                  <NumberField label="Allowance A" value={row.allowanceA} disabled={issued} onChange={(value)=>changeNumber(row.id,"allowanceA",value)} />
                  <NumberField label="Allowance B" value={row.allowanceB} disabled={issued} onChange={(value)=>changeNumber(row.id,"allowanceB",value)} />
                  <NumberField label="Allowance C" value={row.allowanceC} disabled={issued} onChange={(value)=>changeNumber(row.id,"allowanceC",value)} />
                  <NumberField label="Incentive" value={row.monthlyIncentive} disabled={issued} onChange={(value)=>changeNumber(row.id,"monthlyIncentive",value)} />
                  <NumberField label="Approved OT pay" value={row.otPay} disabled={issued} onChange={(value)=>changeNumber(row.id,"otPay",value)} />
                  <NumberField label="Employer EPF" value={row.epfEmployerContribution} disabled={issued} onChange={(value)=>changeNumber(row.id,"epfEmployerContribution",value)} />
                  <NumberField label="Employer SOCSO" value={row.socsoEmployerContribution} disabled={issued} onChange={(value)=>changeNumber(row.id,"socsoEmployerContribution",value)} />
                  <NumberField label="Employer EIS" value={row.eisEmployerContribution} disabled={issued} onChange={(value)=>changeNumber(row.id,"eisEmployerContribution",value)} />
                  <NumberField label="Employee EPF" value={row.epfDeduction} disabled={issued} onChange={(value)=>changeNumber(row.id,"epfDeduction",value)} />
                  <NumberField label="Employee SOCSO" value={row.socsoDeduction} disabled={issued} onChange={(value)=>changeNumber(row.id,"socsoDeduction",value)} />
                  <NumberField label="Employee EIS" value={row.eisDeduction} disabled={issued} onChange={(value)=>changeNumber(row.id,"eisDeduction",value)} />
                  <NumberField label="Tax / PCB" value={row.taxDeduction} disabled={issued} onChange={(value)=>changeNumber(row.id,"taxDeduction",value)} />
                  <NumberField label="Other deduction" value={row.otherDeduction} disabled={issued} onChange={(value)=>changeNumber(row.id,"otherDeduction",value)} />
                </div>
                <aside className="rounded-2xl border border-[#c8a467]/15 bg-[#0d1316] p-5"><p className="text-[10px] font-bold tracking-[.15em] text-[#c8a467]">PAYROLL SUMMARY</p><div className="mt-4 space-y-3 text-sm"><Summary label="Unpaid leave deduction" value={-row.unpaidLeaveDeduction} /><Summary label="Estimated net pay" value={netPay(row)} /><Summary label="Employer staff cost → P&L" value={employmentCost(row)} strong /></div><label className="mt-5 block text-xs text-white/45">Review note<textarea disabled={issued} value={row.remarks || ""} onChange={(event)=>setRows((current)=>current.map((item)=>item.id===row.id?{...item,remarks:event.target.value}:item))} className="mt-2 min-h-20 w-full rounded-xl border border-white/10 bg-[#101619] p-3 text-sm text-white outline-none" /></label>{!issued ? <div className="mt-4 grid gap-2 sm:grid-cols-2"><button disabled={busyId===row.id} onClick={()=>void save(row,false)} className="rounded-xl border border-[#c8a467]/30 px-4 py-3 text-xs font-bold text-[#ead3a8]">Save Draft</button><button disabled={busyId===row.id} onClick={()=>void save(row,true)} className="rounded-xl bg-[#c8a467] px-4 py-3 text-xs font-bold text-[#111416]">Issue & Lock</button></div> : null}</aside>
              </div>
            </article>;
          })}
        </div>
        <section className="mt-7 rounded-[24px] border border-white/10 bg-[#0e1417] p-6 text-xs leading-6 text-white/40"><b className="text-[#e3c78e]">Accounting treatment:</b> employee EPF/SOCSO/EIS deductions reduce net pay; they are not additional P&amp;L expense. Employer EPF/SOCSO/EIS are included in staff cost. Draft payroll can feed the working P&amp;L, but month close remains blocked until all employee payrolls are reviewed and issued.</section>
      </div>
    </main>
  );
}

function NumberField({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (value: string)=>void }) { return <label className="text-xs text-white/45">{label}<input disabled={disabled} type="number" min="0" step="0.01" value={value || 0} onChange={(event)=>onChange(event.target.value)} className={fieldClass} /></label>; }
function Metric({ label, value, warn=false }: { label: string; value: string; warn?: boolean }) { return <div className="rounded-2xl border border-white/10 bg-[#11171b] p-5"><p className="text-[10px] uppercase tracking-[.14em] text-white/30">{label}</p><p className={`mt-2 text-2xl font-bold ${warn?"text-amber-100":"text-[#f0dfbd]"}`}>{value}</p></div>; }
function Summary({ label, value, strong=false }: { label: string; value: number; strong?: boolean }) { return <div className="flex justify-between gap-4"><span className="text-white/45">{label}</span><span className={strong?"font-bold text-[#f0dfbd]":"text-white/70"}>{money(value)}</span></div>; }
