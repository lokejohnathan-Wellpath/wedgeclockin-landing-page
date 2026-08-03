"use client";

import { useEffect, useState } from "react";

type EmployeeSummary = {
  id: string;
  employeeCode: string;
  fullName: string;
};

type Props = {
  employee: EmployeeSummary;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  employmentStartDate: string;
  expectedDailyHours: string;
  basicSalary: string;
  effectiveFrom: string;
  allowanceALabel: string;
  allowanceAAmount: string;
  allowanceBLabel: string;
  allowanceBAmount: string;
  allowanceCLabel: string;
  allowanceCAmount: string;
  annualLeaveEntitlement: string;
  annualLeaveBalance: string;
  medicalLeaveEntitlement: string;
  medicalLeaveBalance: string;
  emergencyLeaveEntitlement: string;
  emergencyLeaveBalance: string;
  hospitalisationLeaveEntitlement: string;
  hospitalisationLeaveBalance: string;
  otherLeaveEntitlement: string;
  otherLeaveBalance: string;
  replacementLeaveBalance: string;
  unpaidLeaveBalance: string;
  replacementClaimHours: string;
  otEligible: boolean;
  normalOtRatio: string;
  restDayOtRatio: string;
  publicHolidayOtRatio: string;
  salaryDivisorDays: string;
  replacementConversionMethod: "actual" | "ratio" | "manager";
  adjustmentReason: string;
};

const initialForm: FormState = {
  employmentStartDate: "",
  expectedDailyHours: "8",
  basicSalary: "0",
  effectiveFrom: "",
  allowanceALabel: "Allowance A",
  allowanceAAmount: "0",
  allowanceBLabel: "Allowance B",
  allowanceBAmount: "0",
  allowanceCLabel: "Allowance C",
  allowanceCAmount: "0",
  annualLeaveEntitlement: "14",
  annualLeaveBalance: "14",
  medicalLeaveEntitlement: "14",
  medicalLeaveBalance: "14",
  emergencyLeaveEntitlement: "0",
  emergencyLeaveBalance: "0",
  hospitalisationLeaveEntitlement: "0",
  hospitalisationLeaveBalance: "0",
  otherLeaveEntitlement: "0",
  otherLeaveBalance: "0",
  replacementLeaveBalance: "0",
  unpaidLeaveBalance: "0",
  replacementClaimHours: "0",
  otEligible: true,
  normalOtRatio: "1.5",
  restDayOtRatio: "2",
  publicHolidayOtRatio: "3",
  salaryDivisorDays: "26",
  replacementConversionMethod: "actual",
  adjustmentReason: "Initial employment and payroll setup",
};

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? String(number) : String(fallback);
}

export default function EmploymentPayrollModal({ employee, onClose, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const api = process.env.NEXT_PUBLIC_API_BASE_URL;
      const token = localStorage.getItem("wc_manager_token");
      if (!api || !token) {
        setError("Manager session is unavailable.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${api}/api/manager/employees/${encodeURIComponent(employee.id)}/employment-payroll`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || "Profile could not be loaded.");
        const profile = data.employee?.payrollDefaults || {};
        const leave = data.leaveBalance || {};
        setForm({
          ...initialForm,
          employmentStartDate: data.employee?.employmentStartDate || "",
          expectedDailyHours: numberValue(data.employee?.expectedDailyHours, 8),
          basicSalary: numberValue(profile.basicSalary),
          effectiveFrom: profile.effectiveFrom || "",
          allowanceALabel: profile.allowanceALabel || "Allowance A",
          allowanceAAmount: numberValue(profile.allowanceAAmount),
          allowanceBLabel: profile.allowanceBLabel || "Allowance B",
          allowanceBAmount: numberValue(profile.allowanceBAmount),
          allowanceCLabel: profile.allowanceCLabel || "Allowance C",
          allowanceCAmount: numberValue(profile.allowanceCAmount),
          annualLeaveEntitlement: numberValue(leave.annualLeaveEntitlement, 14),
          annualLeaveBalance: numberValue(leave.annualLeaveBalance, 14),
          medicalLeaveEntitlement: numberValue(leave.medicalLeaveEntitlement, 14),
          medicalLeaveBalance: numberValue(leave.medicalLeaveBalance, 14),
          emergencyLeaveEntitlement: numberValue(leave.emergencyLeaveEntitlement),
          emergencyLeaveBalance: numberValue(leave.emergencyLeaveBalance),
          hospitalisationLeaveEntitlement: numberValue(leave.hospitalisationLeaveEntitlement),
          hospitalisationLeaveBalance: numberValue(leave.hospitalisationLeaveBalance),
          otherLeaveEntitlement: numberValue(leave.otherLeaveEntitlement),
          otherLeaveBalance: numberValue(leave.otherLeaveBalance),
          replacementLeaveBalance: numberValue(leave.replacementLeaveBalance),
          unpaidLeaveBalance: numberValue(leave.unpaidLeaveBalance),
          replacementClaimHours: numberValue(Number(data.replacementClaimMinutes || 0) / 60),
          otEligible: profile.otEligible !== false,
          normalOtRatio: numberValue(profile.normalOtRatio, 1.5),
          restDayOtRatio: numberValue(profile.restDayOtRatio, 2),
          publicHolidayOtRatio: numberValue(profile.publicHolidayOtRatio, 3),
          salaryDivisorDays: numberValue(profile.salaryDivisorDays, 26),
          replacementConversionMethod: profile.replacementConversionMethod || "actual",
          adjustmentReason: "Manager updated employment and payroll profile",
        });
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Profile could not be loaded.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [employee.id]);

  function update<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function save() {
    const api = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = localStorage.getItem("wc_manager_token");
    if (!api || !token) return;
    const numericFields: Array<keyof FormState> = [
      "expectedDailyHours", "basicSalary", "allowanceAAmount", "allowanceBAmount",
      "allowanceCAmount", "annualLeaveEntitlement", "annualLeaveBalance",
      "medicalLeaveEntitlement", "medicalLeaveBalance", "emergencyLeaveEntitlement",
      "emergencyLeaveBalance", "hospitalisationLeaveEntitlement",
      "hospitalisationLeaveBalance", "otherLeaveEntitlement", "otherLeaveBalance",
      "replacementLeaveBalance", "unpaidLeaveBalance", "replacementClaimHours",
      "normalOtRatio", "restDayOtRatio", "publicHolidayOtRatio", "salaryDivisorDays",
    ];
    for (const field of numericFields) {
      if (!Number.isFinite(Number(form[field])) || Number(form[field]) < 0) {
        setError("All salary, leave and OT values must be valid numbers of 0 or more.");
        return;
      }
    }
    if (!form.adjustmentReason.trim()) {
      setError("Enter a reason so the adjustment is traceable.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(
        `${api}/api/manager/employees/${encodeURIComponent(employee.id)}/employment-payroll`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            employmentStartDate: form.employmentStartDate,
            expectedDailyHours: Number(form.expectedDailyHours),
            payrollDefaults: {
              basicSalary: Number(form.basicSalary),
              effectiveFrom: form.effectiveFrom,
              allowanceALabel: form.allowanceALabel,
              allowanceAAmount: Number(form.allowanceAAmount),
              allowanceBLabel: form.allowanceBLabel,
              allowanceBAmount: Number(form.allowanceBAmount),
              allowanceCLabel: form.allowanceCLabel,
              allowanceCAmount: Number(form.allowanceCAmount),
              otEligible: form.otEligible,
              normalOtRatio: Number(form.normalOtRatio),
              restDayOtRatio: Number(form.restDayOtRatio),
              publicHolidayOtRatio: Number(form.publicHolidayOtRatio),
              salaryDivisorDays: Number(form.salaryDivisorDays),
              replacementConversionMethod: form.replacementConversionMethod,
            },
            leaveBalance: Object.fromEntries(
              [
                "annualLeaveEntitlement", "annualLeaveBalance", "medicalLeaveEntitlement",
                "medicalLeaveBalance", "emergencyLeaveEntitlement", "emergencyLeaveBalance",
                "hospitalisationLeaveEntitlement", "hospitalisationLeaveBalance",
                "otherLeaveEntitlement", "otherLeaveBalance", "replacementLeaveBalance",
                "unpaidLeaveBalance",
              ].map((field) => [field, Number(form[field as keyof FormState])]),
            ),
            replacementClaimHours: Number(form.replacementClaimHours),
            adjustmentReason: form.adjustmentReason.trim(),
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Profile could not be saved.");
      if (form.employmentStartDate) {
        const employmentResponse = await fetch(
          `${api}/api/employment-intelligence/employees/${encodeURIComponent(employee.id)}`,
          {
            method: "PUT",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              employmentStartDate: form.employmentStartDate,
              probationMonths: 3,
            }),
          },
        );
        const employmentData = await employmentResponse.json();
        if (!employmentResponse.ok) {
          throw new Error(employmentData?.message || "Offer letter draft could not be prepared.");
        }
      }
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:p-8">
      <section className="w-full max-w-5xl rounded-[2rem] border border-[#d4ad63]/35 bg-[#161c20] text-[#f4efe6] shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between rounded-t-[2rem] border-b border-white/10 bg-[#161c20]/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs tracking-[0.25em] text-[#d4ad63]">EMPLOYMENT & PAYROLL</p>
            <h2 className="mt-1 text-2xl font-bold text-[#f0dfbd]">{employee.fullName}</h2>
            <p className="text-xs text-white/40">{employee.employeeCode}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-4 py-2 text-white/65">Close</button>
        </header>

        {loading ? <p className="p-8 text-white/55">Loading employee profile…</p> : (
          <div className="space-y-7 p-6 sm:p-8">
            {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

            <Panel title="Employment and salary">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input label="Employment start" type="date" value={form.employmentStartDate} onChange={(v) => update("employmentStartDate", v)} />
                <Input label="Salary effective from" type="date" value={form.effectiveFrom} onChange={(v) => update("effectiveFrom", v)} />
                <Input label="Daily hours" type="number" value={form.expectedDailyHours} onChange={(v) => update("expectedDailyHours", v)} />
                <Input label="Basic salary (RM)" type="number" value={form.basicSalary} onChange={(v) => update("basicSalary", v)} />
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <Allowance label={form.allowanceALabel} amount={form.allowanceAAmount} onLabel={(v) => update("allowanceALabel", v)} onAmount={(v) => update("allowanceAAmount", v)} />
                <Allowance label={form.allowanceBLabel} amount={form.allowanceBAmount} onLabel={(v) => update("allowanceBLabel", v)} onAmount={(v) => update("allowanceBAmount", v)} />
                <Allowance label={form.allowanceCLabel} amount={form.allowanceCAmount} onLabel={(v) => update("allowanceCLabel", v)} onAmount={(v) => update("allowanceCAmount", v)} />
              </div>
            </Panel>

            <Panel title="Leave entitlement and available balance">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="text-left text-white/40"><tr><th className="py-2">Leave type</th><th>Entitlement</th><th>Available now</th></tr></thead>
                  <tbody>
                    <LeaveRow label="Annual Leave" entitlement={form.annualLeaveEntitlement} balance={form.annualLeaveBalance} onEntitlement={(v) => update("annualLeaveEntitlement", v)} onBalance={(v) => update("annualLeaveBalance", v)} />
                    <LeaveRow label="Medical Leave / MC" entitlement={form.medicalLeaveEntitlement} balance={form.medicalLeaveBalance} onEntitlement={(v) => update("medicalLeaveEntitlement", v)} onBalance={(v) => update("medicalLeaveBalance", v)} />
                    <LeaveRow label="Emergency Leave" entitlement={form.emergencyLeaveEntitlement} balance={form.emergencyLeaveBalance} onEntitlement={(v) => update("emergencyLeaveEntitlement", v)} onBalance={(v) => update("emergencyLeaveBalance", v)} />
                    <LeaveRow label="Hospitalisation Leave" entitlement={form.hospitalisationLeaveEntitlement} balance={form.hospitalisationLeaveBalance} onEntitlement={(v) => update("hospitalisationLeaveEntitlement", v)} onBalance={(v) => update("hospitalisationLeaveBalance", v)} />
                    <LeaveRow label="Other Leave" entitlement={form.otherLeaveEntitlement} balance={form.otherLeaveBalance} onEntitlement={(v) => update("otherLeaveEntitlement", v)} onBalance={(v) => update("otherLeaveBalance", v)} />
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Input label="Replacement leave (days)" type="number" value={form.replacementLeaveBalance} onChange={(v) => update("replacementLeaveBalance", v)} />
                <Input label="Unpaid leave used (days)" type="number" value={form.unpaidLeaveBalance} onChange={(v) => update("unpaidLeaveBalance", v)} />
                <Input label="Replacement claim balance (hours)" type="number" value={form.replacementClaimHours} onChange={(v) => update("replacementClaimHours", v)} />
              </div>
            </Panel>

            <Panel title="Overtime policy">
              <label className="mb-4 flex items-center gap-3 text-sm font-semibold text-white/70">
                <input type="checkbox" checked={form.otEligible} onChange={(event) => update("otEligible", event.target.checked)} className="h-5 w-5 accent-[#d4ad63]" />
                Employee is eligible for overtime
              </label>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input label="Normal-day ratio" type="number" value={form.normalOtRatio} onChange={(v) => update("normalOtRatio", v)} />
                <Input label="Rest-day ratio" type="number" value={form.restDayOtRatio} onChange={(v) => update("restDayOtRatio", v)} />
                <Input label="Public-holiday ratio" type="number" value={form.publicHolidayOtRatio} onChange={(v) => update("publicHolidayOtRatio", v)} />
                <Input label="Salary divisor (days)" type="number" value={form.salaryDivisorDays} onChange={(v) => update("salaryDivisorDays", v)} />
              </div>
              <label className="mt-4 block text-sm font-semibold text-white/65">Replacement-hour conversion
                <select value={form.replacementConversionMethod} onChange={(event) => update("replacementConversionMethod", event.target.value as FormState["replacementConversionMethod"])} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d1113] px-4 py-3 text-white sm:max-w-md">
                  <option value="actual">1:1 actual hours</option>
                  <option value="ratio">Apply approved OT ratio</option>
                  <option value="manager">Manager enters final credit</option>
                </select>
              </label>
            </Panel>

            <Panel title="Audit reason">
              <textarea value={form.adjustmentReason} onChange={(event) => update("adjustmentReason", event.target.value)} rows={3} maxLength={500} className="w-full rounded-xl border border-white/10 bg-[#0d1113] px-4 py-3 outline-none focus:border-[#d4ad63]" />
            </Panel>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-6 py-3 text-white/65">Cancel</button>
              <button type="button" disabled={saving} onClick={() => void save()} className="rounded-full bg-[#d4ad63] px-7 py-3 font-bold text-[#101416] disabled:opacity-50">{saving ? "Saving…" : "Save and Synchronise"}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><h3 className="mb-4 text-lg font-bold text-[#f0dfbd]">{title}</h3>{children}</section>;
}

function Input({ label, value, onChange, type }: { label: string; value: string; onChange: (value: string) => void; type: string }) {
  return <label className="block text-sm font-semibold text-white/60">{label}<input type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "0.01" : undefined} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0d1113] px-4 py-3 text-white outline-none focus:border-[#d4ad63]" /></label>;
}

function Allowance({ label, amount, onLabel, onAmount }: { label: string; amount: string; onLabel: (value: string) => void; onAmount: (value: string) => void }) {
  return <div className="rounded-xl border border-white/8 p-3"><input value={label} onChange={(event) => onLabel(event.target.value)} maxLength={60} aria-label="Allowance label" className="w-full bg-transparent text-sm font-semibold text-[#f0dfbd] outline-none" /><input type="number" min="0" step="0.01" value={amount} onChange={(event) => onAmount(event.target.value)} aria-label={`${label} amount`} className="mt-2 w-full rounded-lg border border-white/10 bg-[#0d1113] px-3 py-2" /></div>;
}

function LeaveRow({ label, entitlement, balance, onEntitlement, onBalance }: { label: string; entitlement: string; balance: string; onEntitlement: (value: string) => void; onBalance: (value: string) => void }) {
  return <tr className="border-t border-white/8"><td className="py-3 font-semibold text-white/70">{label}</td><td className="pr-3"><input type="number" min="0" step="0.5" value={entitlement} onChange={(event) => onEntitlement(event.target.value)} className="w-28 rounded-lg border border-white/10 bg-[#0d1113] px-3 py-2" /></td><td><input type="number" min="0" step="0.5" value={balance} onChange={(event) => onBalance(event.target.value)} className="w-28 rounded-lg border border-white/10 bg-[#0d1113] px-3 py-2" /></td></tr>;
}
