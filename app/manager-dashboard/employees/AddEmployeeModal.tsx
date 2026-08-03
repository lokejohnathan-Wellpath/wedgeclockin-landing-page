"use client";

import { useState } from "react";

type CreatedEmployee = {
  id: string;
  employeeCode: string;
  fullName: string;
  probationEndDate?: string;
};

const initialForm = {
  fullName: "",
  icNumber: "",
  phoneNumber: "",
  department: "",
  position: "",
  employmentStartDate: "",
  expectedDailyHours: "8",
  basicSalary: "0",
  annualLeaveEntitlement: "14",
  medicalLeaveEntitlement: "14",
  probationMonths: "3",
  reportingManager: "",
  workLocation: "",
  residentialAddress: "",
  temporaryPassword: "",
};

export default function AddEmployeeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState(initialForm);
  const [created, setCreated] = useState<CreatedEmployee | null>(null);
  const [creating, setCreating] = useState(false);
  const [registeringFace, setRegisteringFace] = useState(false);
  const [faceComplete, setFaceComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  function update(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function createEmployee() {
    const token = localStorage.getItem("wc_manager_token");
    if (!api || !token) { setError("Manager session is unavailable."); return; }
    if (!form.fullName.trim() || !form.icNumber.trim() || !form.department.trim() || !form.position.trim() || !form.employmentStartDate) {
      setError("Name, IC/passport, department, position and employment date are required.");
      return;
    }
    if (form.temporaryPassword.length < 8) {
      setError("Temporary password must contain at least 8 characters.");
      return;
    }
    setCreating(true); setError(""); setMessage("");
    try {
      const response = await fetch(`${api}/api/manager/employees`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          expectedDailyHours: Number(form.expectedDailyHours),
          basicSalary: Number(form.basicSalary),
          annualLeaveEntitlement: Number(form.annualLeaveEntitlement),
          medicalLeaveEntitlement: Number(form.medicalLeaveEntitlement),
          probationMonths: Number(form.probationMonths),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Employee could not be created.");
      setCreated(data.employee);
      onCreated();

      const offerResponse = await fetch(`${api}/api/employment-intelligence/employees/${encodeURIComponent(data.employee.id)}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          employmentStartDate: form.employmentStartDate,
          probationMonths: Number(form.probationMonths),
          reportingManager: form.reportingManager,
          workLocation: form.workLocation,
          residentialAddress: form.residentialAddress,
        }),
      });
      const offerData = await offerResponse.json();
      setMessage(offerResponse.ok ? offerData.message : "Employee created. Offer draft can be prepared later from Employment Letters.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Employee could not be created.");
    } finally { setCreating(false); }
  }

  async function registerFace(file?: File) {
    if (!file || !created) return;
    const token = localStorage.getItem("wc_manager_token");
    if (!api || !token) return;
    setRegisteringFace(true); setError(""); setMessage("");
    try {
      const faceImageBase64 = await resizeImage(file);
      const response = await fetch(`${api}/api/manager/employees/${encodeURIComponent(created.id)}/face`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ faceImageBase64 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Face registration failed.");
      setFaceComplete(true); setMessage(`${created.fullName}'s face was registered securely.`); onCreated();
    } catch (faceError) {
      setError(faceError instanceof Error ? faceError.message : "Face registration failed.");
    } finally { setRegisteringFace(false); }
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-8">
    <section className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[#d4ad63]/35 bg-[#161c20] text-[#f4efe6] shadow-2xl">
      <header className="sticky top-0 z-20 flex items-center justify-between rounded-t-[2rem] border-b border-white/10 bg-[#161c20]/95 px-5 py-5 backdrop-blur sm:px-7">
        <div><p className="text-xs tracking-[.25em] text-[#d4ad63]">EMPLOYEE ONBOARDING</p><h2 className="mt-1 text-2xl font-bold text-[#f0dfbd]">{created ? "Register Employee Face" : "Add New Employee"}</h2></div>
        <button type="button" onClick={onClose} className="rounded-full border border-white/15 px-4 py-2 text-white/65">Close</button>
      </header>

      <div className="p-5 sm:p-8">
        {error && <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}
        {message && <div className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">{message}</div>}

        {!created ? <div className="space-y-6">
          <Panel title="Employee identity">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input label="Full name *" value={form.fullName} onChange={(value) => update("fullName", value)} />
              <Input label="IC / Passport number *" value={form.icNumber} onChange={(value) => update("icNumber", value)} />
              <Input label="Phone number" value={form.phoneNumber} onChange={(value) => update("phoneNumber", value)} />
              <Input label="Department *" value={form.department} onChange={(value) => update("department", value)} />
              <Input label="Position *" value={form.position} onChange={(value) => update("position", value)} />
              <Input label="Reporting manager" value={form.reportingManager} onChange={(value) => update("reportingManager", value)} />
              <Input label="Work location" value={form.workLocation} onChange={(value) => update("workLocation", value)} />
              <label className="block text-sm font-semibold text-white/65 sm:col-span-2">Residential address<textarea rows={3} value={form.residentialAddress} onChange={(event) => update("residentialAddress", event.target.value)} className={inputClass} /></label>
            </div>
          </Panel>
          <Panel title="Employment, payroll and leave opening">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Input type="date" label="Employment start *" value={form.employmentStartDate} onChange={(value) => update("employmentStartDate", value)} />
              <Input type="number" label="Probation months" value={form.probationMonths} onChange={(value) => update("probationMonths", value)} />
              <Input type="number" label="Daily hours" value={form.expectedDailyHours} onChange={(value) => update("expectedDailyHours", value)} />
              <Input type="number" label="Basic salary (RM)" value={form.basicSalary} onChange={(value) => update("basicSalary", value)} />
              <Input type="number" label="Annual leave opening" value={form.annualLeaveEntitlement} onChange={(value) => update("annualLeaveEntitlement", value)} />
              <Input type="number" label="Medical leave opening" value={form.medicalLeaveEntitlement} onChange={(value) => update("medicalLeaveEntitlement", value)} />
            </div>
          </Panel>
          <Panel title="First employee login">
            <p className="mb-4 text-sm leading-6 text-white/50">The employee logs in using the company outlet short name, IC/passport number and this temporary password. Record it securely before continuing.</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><Input type={showPassword ? "text" : "password"} label="Temporary password *" value={form.temporaryPassword} onChange={(value) => update("temporaryPassword", value)} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="self-end rounded-xl border border-white/15 px-5 py-3 text-sm">{showPassword ? "Hide" : "Show"}</button></div>
          </Panel>
          <button type="button" disabled={creating} onClick={() => void createEmployee()} className="w-full rounded-xl bg-[#d4ad63] px-6 py-4 text-lg font-bold text-[#101416] disabled:opacity-50">{creating ? "Creating employee…" : "Create Employee & Continue to Face"}</button>
        </div> : <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5"><p className="text-sm text-emerald-100/70">Employee created</p><h3 className="mt-2 text-2xl font-bold text-emerald-100">{created.fullName}</h3><p className="mt-2 font-mono text-[#e5c584]">{created.employeeCode}</p><p className="mt-3 text-sm text-white/55">Probation ends: {created.probationEndDate || "—"}</p></div>
          <Panel title="AI face registration required">
            <p className="text-sm leading-6 text-white/55">Use the manager phone or PWA camera. Only the employee may appear in the photograph. The API rejects photographs with no face or multiple faces, then encrypts the approved face profile.</p>
            <label className={`mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center ${faceComplete ? "border-emerald-400/40 bg-emerald-500/10" : "border-[#d4ad63]/45 bg-[#d4ad63]/5"}`}>
              <input type="file" accept="image/jpeg,image/png,image/webp" capture="user" className="hidden" disabled={registeringFace} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void registerFace(file); }} />
              <span className="text-3xl">{faceComplete ? "✓" : "◎"}</span><span className="mt-3 font-bold text-[#f0dfbd]">{registeringFace ? "AI checking face…" : faceComplete ? "Face registered securely" : "Open Camera & Register Face"}</span><span className="mt-2 text-xs text-white/40">Front-facing, good lighting, one person only</span>
            </label>
          </Panel>
          <button type="button" disabled={!faceComplete} onClick={onClose} className="w-full rounded-xl bg-[#d4ad63] px-6 py-4 font-bold text-[#101416] disabled:opacity-30">Finish Employee Onboarding</button>
          {!faceComplete && <p className="text-center text-xs text-white/35">If you close now, the employee remains marked Pending Face and cannot complete verified clock-in until registered.</p>}
        </div>}
      </div>
    </section>
  </div>;
}

const inputClass = "mt-2 w-full rounded-xl border border-white/10 bg-[#0f1315] px-4 py-3 text-white outline-none focus:border-[#d4ad63]";
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-[#1e2428] p-5"><h3 className="mb-5 text-xl font-bold text-[#f0dfbd]">{title}</h3>{children}</section>; }
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-sm font-semibold text-white/65">{label}<input type={type} value={value} min={type === "number" ? "0" : undefined} onChange={(event) => onChange(event.target.value)} className={inputClass} /></label>; }

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The photograph could not be read."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("The photograph format is not supported."));
      image.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) { reject(new Error("The photograph could not be prepared.")); return; }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
