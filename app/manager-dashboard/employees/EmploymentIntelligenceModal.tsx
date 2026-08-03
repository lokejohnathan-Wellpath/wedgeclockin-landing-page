"use client";

import { useEffect, useState } from "react";

type EmployeeSummary = { id: string; employeeCode: string; fullName: string };
type EmploymentDocument = {
  id: string;
  type: string;
  title: string;
  status: "draft" | "issued" | "acknowledged";
  renderedContent: string;
  issuedAt?: string;
};
type EmploymentProfile = {
  employmentStartDate?: string;
  residentialAddress?: string;
  reportingManager?: string;
  workLocation?: string;
  probationMonths?: number;
  probationStartDate?: string;
  probationEndDate?: string;
  probationStatus?: string;
  lastWorkingDate?: string;
  retentionDeleteAt?: string;
  offboardingDownloadAcknowledgedAt?: string;
};

export default function EmploymentIntelligenceModal({
  employee,
  onClose,
  onChanged,
}: {
  employee: EmployeeSummary;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [profile, setProfile] = useState<EmploymentProfile>({ probationMonths: 3 });
  const [documents, setDocuments] = useState<EmploymentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [decision, setDecision] = useState("confirmed");
  const [decisionDate, setDecisionDate] = useState("");
  const [decisionNote, setDecisionNote] = useState("");
  const [downloaded, setDownloaded] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const api = process.env.NEXT_PUBLIC_API_BASE_URL;
  const token = typeof window === "undefined" ? "" : localStorage.getItem("wc_manager_token") || "";

  async function load() {
    if (!api || !token) return;
    setLoading(true);
    try {
      const response = await fetch(`${api}/api/employment-intelligence/employees/${encodeURIComponent(employee.id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || "Employment file could not be loaded.");
      setProfile({ probationMonths: 3, ...data.employee });
      setDocuments(data.documents || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Employment file could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [employee.id]);

  async function request(path: string, options: RequestInit = {}) {
    if (!api || !token) throw new Error("Manager session is unavailable.");
    const response = await fetch(`${api}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || "The action could not be completed.");
    return data;
  }

  async function saveProfile() {
    setWorking("profile"); setError(""); setMessage("");
    try {
      const data = await request(`/api/employment-intelligence/employees/${encodeURIComponent(employee.id)}`, {
        method: "PUT",
        body: JSON.stringify({
          employmentStartDate: profile.employmentStartDate || "",
          residentialAddress: profile.residentialAddress || "",
          reportingManager: profile.reportingManager || "",
          workLocation: profile.workLocation || "",
          probationMonths: Number(profile.probationMonths || 3),
        }),
      });
      setMessage(data.message);
      await load(); onChanged();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save."); }
    finally { setWorking(""); }
  }

  async function saveDocument(document: EmploymentDocument, issue = false) {
    setWorking(document.id); setError("");
    try {
      const data = await request(`/api/employment-intelligence/documents/${encodeURIComponent(document.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ renderedContent: document.renderedContent, action: issue ? "issue" : "save" }),
      });
      setMessage(data.message); await load();
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Unable to save document."); }
    finally { setWorking(""); }
  }

  async function deleteDraft(document: EmploymentDocument) {
    if (!window.confirm(`Delete draft ${document.title}?`)) return;
    setWorking(document.id);
    try {
      const data = await request(`/api/employment-intelligence/documents/${encodeURIComponent(document.id)}`, { method: "DELETE" });
      setMessage(data.message); await load();
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Unable to delete draft."); }
    finally { setWorking(""); }
  }

  async function downloadPdf(document: EmploymentDocument) {
    if (!api || !token) return;
    const response = await fetch(`${api}/api/employment-intelligence/documents/${encodeURIComponent(document.id)}/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) { setError("PDF could not be downloaded."); return; }
    const url = URL.createObjectURL(await response.blob());
    const anchor = window.document.createElement("a");
    anchor.href = url; anchor.download = `${document.type}-${employee.employeeCode}.pdf`; anchor.click();
    URL.revokeObjectURL(url);
  }

  async function applyDecision() {
    setWorking("decision"); setError("");
    try {
      const body: Record<string, string> = { decision, note: decisionNote };
      if (decision === "extended") body.newEndDate = decisionDate;
      if (decision === "resigned") body.lastWorkingDate = decisionDate;
      const data = await request(`/api/employment-intelligence/employees/${encodeURIComponent(employee.id)}/probation-decision`, {
        method: "POST", body: JSON.stringify(body),
      });
      setMessage(data.message); await load(); onChanged();
    } catch (decisionError) { setError(decisionError instanceof Error ? decisionError.message : "Decision could not be saved."); }
    finally { setWorking(""); }
  }

  async function downloadSafeCopy() {
    if (!api || !token) return;
    setWorking("safe-copy");
    try {
      const response = await fetch(`${api}/api/employment-intelligence/employees/${encodeURIComponent(employee.id)}/safe-copy`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Safe copy could not be downloaded.");
      const url = URL.createObjectURL(new Blob([JSON.stringify(await response.json(), null, 2)], { type: "application/json" }));
      const anchor = window.document.createElement("a");
      anchor.href = url; anchor.download = `${employee.employeeCode}-employment-safe-copy.json`; anchor.click();
      URL.revokeObjectURL(url); setDownloaded(true); setMessage("Safe copy downloaded. Download each issued PDF below as well.");
    } catch (copyError) { setError(copyError instanceof Error ? copyError.message : "Safe copy could not be downloaded."); }
    finally { setWorking(""); }
  }

  async function permanentlyDelete() {
    setWorking("delete"); setError("");
    try {
      const data = await request(`/api/employment-intelligence/employees/${encodeURIComponent(employee.id)}`, {
        method: "DELETE",
        body: JSON.stringify({ confirmText, acknowledgeDownloaded: downloaded }),
      });
      setMessage(data.message); onChanged(); onClose();
    } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Employee could not be deleted."); }
    finally { setWorking(""); }
  }

  return <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 backdrop-blur-sm sm:p-8">
    <section className="mx-auto w-full max-w-5xl rounded-[2rem] border border-[#d4ad63]/35 bg-[#161c20] text-[#f4efe6] shadow-2xl">
      <header className="sticky top-0 z-20 flex items-center justify-between rounded-t-[2rem] border-b border-white/10 bg-[#161c20]/95 px-6 py-5 backdrop-blur">
        <div><p className="text-xs tracking-[.25em] text-[#d4ad63]">EMPLOYMENT INTELLIGENCE</p><h2 className="mt-1 text-2xl font-bold text-[#f0dfbd]">{employee.fullName}</h2><p className="text-xs text-white/40">{employee.employeeCode}</p></div>
        <button onClick={onClose} className="rounded-full border border-white/15 px-4 py-2 text-white/65">Close</button>
      </header>
      {loading ? <p className="p-8 text-white/55">Loading employment file…</p> : <div className="space-y-6 p-6 sm:p-8">
        {error && <Notice tone="error">{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}
        <Panel title="Employment and probation profile">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Employment start" type="date" value={profile.employmentStartDate || ""} onChange={(value) => setProfile({ ...profile, employmentStartDate: value })} />
            <Input label="Probation months" type="number" value={String(profile.probationMonths || 3)} onChange={(value) => setProfile({ ...profile, probationMonths: Number(value) })} />
            <Input label="Reporting manager" value={profile.reportingManager || ""} onChange={(value) => setProfile({ ...profile, reportingManager: value })} />
            <Input label="Work location" value={profile.workLocation || ""} onChange={(value) => setProfile({ ...profile, workLocation: value })} />
            <label className="sm:col-span-2 block text-sm font-semibold text-white/65">Residential address<textarea rows={3} value={profile.residentialAddress || ""} onChange={(event) => setProfile({ ...profile, residentialAddress: event.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1315] px-4 py-3 outline-none focus:border-[#d4ad63]" /></label>
          </div>
          <p className="mt-4 text-sm text-white/45">Status: <b className="text-[#e5c584]">{profile.probationStatus || "not-started"}</b> · End: {profile.probationEndDate || "—"}</p>
          <button onClick={() => void saveProfile()} disabled={working === "profile"} className="mt-4 rounded-xl bg-[#d4ad63] px-5 py-3 font-bold text-[#101416]">{working === "profile" ? "Saving…" : "Save & Prepare Offer"}</button>
        </Panel>

        <Panel title="Letters and PDF safe copies">
          <div className="space-y-4">{documents.length === 0 && <p className="text-sm text-white/45">Save the employment profile to prepare an offer-letter draft.</p>}{documents.map((document) => <article key={document.id} className="rounded-2xl border border-white/8 bg-[#111619] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><h4 className="font-bold text-[#f0dfbd]">{document.title}</h4><p className="mt-1 text-xs uppercase tracking-wider text-white/40">{document.status}</p></div><div className="flex flex-wrap gap-2">
              {document.status === "draft" && <><button onClick={() => void saveDocument(document)} className="rounded-lg border border-white/15 px-3 py-2 text-sm">Save draft</button><button onClick={() => void saveDocument(document, true)} className="rounded-lg bg-[#d4ad63] px-3 py-2 text-sm font-bold text-[#101416]">Issue</button><button onClick={() => void deleteDraft(document)} className="rounded-lg border border-red-400/30 px-3 py-2 text-sm text-red-200">Delete</button></>}
              <button onClick={() => void downloadPdf(document)} className="rounded-lg border border-[#d4ad63]/40 px-3 py-2 text-sm text-[#e5c584]">Download PDF</button>
            </div></div>
            {document.status === "draft" && <textarea rows={12} value={document.renderedContent} onChange={(event) => setDocuments((current) => current.map((item) => item.id === document.id ? { ...item, renderedContent: event.target.value } : item))} className="mt-4 w-full rounded-xl border border-white/10 bg-[#0b0f11] p-4 text-sm leading-6 outline-none focus:border-[#d4ad63]" />}
          </article>)}</div>
        </Panel>

        <Panel title="Probation decision">
          <div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-semibold text-white/65">Decision<select value={decision} onChange={(event) => setDecision(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1315] px-4 py-3"><option value="confirmed">Confirm</option><option value="extended">Extend probation</option><option value="not-confirmed">Not confirmed</option><option value="resigned">Resigned</option></select></label>{(decision === "extended" || decision === "resigned") && <Input label={decision === "extended" ? "New probation end" : "Last working date"} type="date" value={decisionDate} onChange={setDecisionDate} />}<Input label="Decision note" value={decisionNote} onChange={setDecisionNote} /></div>
          <button onClick={() => void applyDecision()} disabled={working === "decision"} className="mt-4 rounded-xl bg-[#d4ad63] px-5 py-3 font-bold text-[#101416]">Save Decision & Generate Letter</button>
          {profile.retentionDeleteAt && <Notice tone="warning">Resigned employee data is scheduled for permanent deletion on {new Date(profile.retentionDeleteAt).toLocaleDateString("en-MY")}. Download all records before then.</Notice>}
        </Panel>

        <Panel title="Safe copy and permanent deletion">
          <p className="text-sm leading-6 text-white/55">Download the employee record and every PDF before deletion. Permanent deletion cannot be undone.</p>
          <button onClick={() => void downloadSafeCopy()} className="mt-4 rounded-xl border border-[#d4ad63]/45 px-5 py-3 font-semibold text-[#e5c584]">Download Employee Safe Copy</button>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"><Input label={`Type DELETE ${employee.employeeCode}`} value={confirmText} onChange={setConfirmText} /><button onClick={() => void permanentlyDelete()} disabled={!downloaded || confirmText !== `DELETE ${employee.employeeCode}`} className="self-end rounded-xl bg-red-500/80 px-5 py-3 font-bold text-white disabled:opacity-30">Delete Employee & All Data</button></div>
        </Panel>
      </div>}
    </section>
  </div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-white/10 bg-[#1e2428] p-5"><h3 className="mb-5 text-xl font-bold text-[#f0dfbd]">{title}</h3>{children}</section>; }
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="block text-sm font-semibold text-white/65">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0f1315] px-4 py-3 outline-none focus:border-[#d4ad63]" /></label>; }
function Notice({ tone, children }: { tone: "error" | "success" | "warning"; children: React.ReactNode }) { const style = tone === "error" ? "border-red-400/30 bg-red-500/10 text-red-200" : tone === "success" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100" : "border-amber-400/30 bg-amber-500/10 text-amber-100"; return <div className={`mt-4 rounded-xl border p-4 text-sm ${style}`}>{children}</div>; }
