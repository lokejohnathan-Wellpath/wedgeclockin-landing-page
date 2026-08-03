"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EmploymentIntelligenceModal from "../employees/EmploymentIntelligenceModal";

type Template = { type: string; name: string; content: string; version: number };
type Reminder = { id: string; employeeCode: string; fullName: string; probationEndDate?: string; reminder?: string; retentionDeleteAt?: string };

export default function EmploymentIntelligencePage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [employees, setEmployees] = useState<Reminder[]>([]);
  const [selectedType, setSelectedType] = useState("offer");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Reminder | null>(null);
  const api = process.env.NEXT_PUBLIC_API_BASE_URL;

  async function load() {
    const token = localStorage.getItem("wc_manager_token");
    if (!api || !token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [templatesResponse, overviewResponse] = await Promise.all([
        fetch(`${api}/api/employment-intelligence/templates`, { headers }),
        fetch(`${api}/api/employment-intelligence/overview`, { headers }),
      ]);
      const [templatesData, overviewData] = await Promise.all([templatesResponse.json(), overviewResponse.json()]);
      if (!templatesResponse.ok) throw new Error(templatesData?.message || "Templates could not be loaded.");
      if (!overviewResponse.ok) throw new Error(overviewData?.message || "Probation reminders could not be loaded.");
      setTemplates(templatesData.templates || []); setEmployees(overviewData.employees || []);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Employment intelligence could not be loaded."); }
  }

  useEffect(() => { void load(); }, []);
  const selected = templates.find((template) => template.type === selectedType);

  async function saveTemplate() {
    const token = localStorage.getItem("wc_manager_token");
    if (!api || !token || !selected) return;
    setSaving(true); setError("");
    try {
      const response = await fetch(`${api}/api/employment-intelligence/templates/${selected.type}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: selected.name, content: selected.content }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Template could not be saved.");
      setMessage(`${data.message} Existing issued letters are unchanged.`); await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Template could not be saved."); }
    finally { setSaving(false); }
  }

  function updateSelected(field: "name" | "content", value: string) {
    setTemplates((current) => current.map((template) => template.type === selectedType ? { ...template, [field]: value } : template));
  }

  return <main className="min-h-screen bg-[#101416] px-5 py-8 text-[#f4efe6] sm:px-8">
    <section className="mx-auto max-w-7xl">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between"><div><p className="text-sm tracking-[.3em] text-[#d4ad63]">WORKFORCE DOCUMENTS</p><h1 className="mt-2 text-4xl font-bold text-[#f0dfbd]">Employment Intelligence</h1><p className="mt-2 text-white/50">One company format, automatic letters, probation reminders and 45-day offboarding retention.</p></div><div className="flex gap-3"><button onClick={() => router.push("/manager-dashboard/employees")} className="rounded-full bg-[#d4ad63] px-5 py-3 font-bold text-[#101416]">Employee Management</button><button onClick={() => router.push("/manager-dashboard")} className="rounded-full border border-white/15 px-5 py-3">Dashboard</button></div></header>
      {error && <div className="mt-5 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-red-200">{error}</div>}{message && <div className="mt-5 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-100">{message}</div>}
      <div className="mt-7 grid gap-6 lg:grid-cols-[.85fr_1.4fr]">
        <section className="rounded-[1.75rem] border border-white/10 bg-[#1e2428] p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-bold text-[#f0dfbd]">Action inbox</h2><span className="rounded-full bg-red-500 px-3 py-1 text-sm font-bold">{employees.filter((item) => item.reminder).length}</span></div><div className="mt-4 space-y-3">{employees.filter((item) => item.reminder || item.retentionDeleteAt).map((item) => <article key={item.id} className="rounded-xl border border-white/8 bg-[#13181b] p-4"><p className="font-bold text-[#f0dfbd]">{item.fullName} · {item.employeeCode}</p>{item.reminder && <p className="mt-2 text-sm text-amber-200">{item.reminder}</p>}{item.retentionDeleteAt && <p className="mt-2 text-xs text-red-200">Download deadline: {new Date(item.retentionDeleteAt).toLocaleDateString("en-MY")}</p>}</article>)}{!employees.some((item) => item.reminder || item.retentionDeleteAt) && <p className="text-sm text-white/45">No employment actions due.</p>}</div></section>
        <section className="rounded-[1.75rem] border border-[#d4ad63]/25 bg-[#1e2428] p-5"><h2 className="text-xl font-bold text-[#f0dfbd]">Company letter formats</h2><div className="mt-4 flex flex-wrap gap-2">{templates.map((template) => <button key={template.type} onClick={() => setSelectedType(template.type)} className={`rounded-full px-4 py-2 text-sm font-semibold ${selectedType === template.type ? "bg-[#d4ad63] text-[#101416]" : "border border-white/15 text-white/60"}`}>{template.type}</button>)}</div>{selected && <div className="mt-5 space-y-4"><label className="block text-sm font-semibold text-white/60">Template name<input value={selected.name} onChange={(event) => updateSelected("name", event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 outline-none focus:border-[#d4ad63]" /></label><label className="block text-sm font-semibold text-white/60">Letter format<textarea rows={20} value={selected.content} onChange={(event) => updateSelected("content", event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#101416] p-4 font-mono text-sm leading-6 outline-none focus:border-[#d4ad63]" /></label><p className="text-xs leading-5 text-white/40">Placeholders such as {"{{employeeName}}"}, {"{{position}}"}, {"{{startDate}}"}, {"{{basicSalary}}"} and {"{{companyName}}"} are filled automatically.</p><button onClick={() => void saveTemplate()} disabled={saving} className="rounded-xl bg-[#d4ad63] px-5 py-3 font-bold text-[#101416]">{saving ? "Saving…" : "Save Company Format"}</button></div>}</section>
      </div>
      <section className="mt-6 rounded-[1.75rem] border border-white/10 bg-[#1e2428] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs tracking-[.22em] text-[#d4ad63]">EMPLOYEE FILES</p><h2 className="mt-2 text-xl font-bold text-[#f0dfbd]">Prepare letters and manage probation</h2></div><p className="text-sm text-white/40">{employees.length} employee(s)</p></div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{employees.map((item) => <article key={item.id} className="rounded-2xl border border-white/8 bg-[#13181b] p-4"><p className="font-bold text-[#f0dfbd]">{item.fullName}</p><p className="mt-1 text-xs text-white/40">{item.employeeCode} · Probation end {item.probationEndDate || "not set"}</p>{item.reminder && <p className="mt-2 text-xs text-amber-200">{item.reminder}</p>}<button type="button" onClick={() => setSelectedEmployee(item)} className="mt-4 w-full rounded-xl border border-[#d4ad63]/45 px-4 py-2.5 text-sm font-bold text-[#e5c584] hover:bg-[#d4ad63]/10">Open Employment File</button></article>)}</div>
      </section>
    </section>
    {selectedEmployee && <EmploymentIntelligenceModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onChanged={() => void load()} />}
  </main>;
}
