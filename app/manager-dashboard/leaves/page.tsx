"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { downloadSimpleXlsx } from "../../lib/simpleXlsx";

type LeaveItem = {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
};

function formatDate(value: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-MY", { timeZone: "Asia/Kuala_Lumpur" });
}

function safeFilePart(value: string) {
  return value.trim().replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "employee";
}

export default function LeaveApprovalPage() {
  const router = useRouter();
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [exporting, setExporting] = useState(false);

  async function loadLeaves() {
    const token = localStorage.getItem("wc_manager_token");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token) { router.push("/manager-login"); return; }
    if (!apiBaseUrl) { setMessage("Service is not ready."); setLoading(false); return; }

    try {
      const response = await fetch(apiBaseUrl + "/api/manager/leaves", { headers: { Authorization: "Bearer " + token } });
      const data = await response.json();
      if (!response.ok) { setMessage("Leave records could not be loaded."); setLoading(false); return; }
      setLeaves(data.leaves || []);
      setMessage("");
    } catch {
      setMessage("Leave records could not be loaded.");
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const token = localStorage.getItem("wc_manager_token");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token || !apiBaseUrl) return;
    try {
      const response = await fetch(apiBaseUrl + "/api/manager/leaves/" + id + "/status", {
        method: "PUT",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) { setMessage("Leave status could not be updated."); return; }
      setLeaves((current) => current.map((item) => item.id === id ? { ...item, status } : item));
      setMessage(status === "approved" ? "Leave approved." : "Leave rejected.");
    } catch {
      setMessage("Leave status could not be updated.");
    }
  }

  useEffect(() => { void loadLeaves(); }, []);

  const employeeNames = useMemo(
    () => Array.from(new Set(leaves.map((item) => item.employeeName).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [leaves],
  );

  useEffect(() => {
    if (!selectedEmployee && employeeNames.length) setSelectedEmployee(employeeNames[0]);
  }, [employeeNames, selectedEmployee]);

  const pending = leaves.filter((item) => item.status === "pending").length;
  const approved = leaves.filter((item) => item.status === "approved").length;
  const rejected = leaves.filter((item) => item.status === "rejected").length;

  async function exportSelectedEmployee() {
    if (!selectedEmployee) { setMessage("Select an employee first."); return; }
    const records = leaves.filter((item) => item.employeeName === selectedEmployee);
    setExporting(true);
    setMessage("");
    try {
      const approvedCount = records.filter((item) => item.status === "approved").length;
      const pendingCount = records.filter((item) => item.status === "pending").length;
      const rejectedCount = records.filter((item) => item.status === "rejected").length;
      await downloadSimpleXlsx(
        `wedge-leave-${safeFilePart(selectedEmployee)}.xlsx`,
        "Leave Report",
        [
          ["Wedge CLOCKin - Individual Leave Management Report"],
          ["Employee", selectedEmployee],
          ["Total Leave Records", records.length],
          ["Approved", approvedCount],
          ["Pending", pendingCount],
          ["Rejected", rejectedCount],
          [],
          ["Employee", "Leave Type", "Start Date", "End Date", "Reason", "Status"],
          ...records.map((item) => [
            item.employeeName,
            item.leaveType,
            formatDate(item.startDate),
            formatDate(item.endDate),
            item.reason || "—",
            item.status,
          ]),
        ],
      );
    } catch {
      setMessage("Individual leave Excel report could not be prepared.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm tracking-[0.35em] text-[#d4ad63]">WEDGECLOCKIN</p>
            <h1 className="mt-2 text-4xl font-bold text-[#f0dfbd]">Leave Approval</h1>
            <p className="mt-2 text-white/55">Review and update employee leave requests.</p>
          </div>
          <button type="button" onClick={() => router.push("/manager-dashboard")} className="rounded-full border border-[#d4ad63]/50 px-6 py-3 font-semibold text-[#f0dfbd] hover:bg-white/5">Back</button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[["Total", leaves.length, "text-[#d4ad63]"], ["Pending", pending, "text-yellow-200"], ["Approved", approved, "text-green-200"], ["Rejected", rejected, "text-red-200"]].map(([label, value, color]) => (
            <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-white/45">{label}</p>
              <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-[2rem] border border-[#d4ad63]/25 bg-[#1e2428] p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <label className="flex-1 text-sm font-semibold text-[#f0dfbd]">
              Individual Leave Management Report
              <select value={selectedEmployee} onChange={(event) => setSelectedEmployee(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]">
                {employeeNames.length === 0 ? <option value="">No employees with leave records</option> : employeeNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => void exportSelectedEmployee()} disabled={!selectedEmployee || exporting} className="rounded-full bg-[#d4ad63] px-6 py-3 font-bold text-[#101416] disabled:opacity-50">
              {exporting ? "Preparing…" : "Download Excel"}
            </button>
          </div>
          <p className="mt-3 text-xs text-white/45">Exports only the selected employee&apos;s leave-management records shown in this system.</p>
        </div>

        {(loading || message) && <div className="mt-8 rounded-[2rem] border border-[#d4ad63]/30 bg-[#1e2428] p-5 text-sm text-white/60">{loading ? "Loading leave records..." : message}</div>}

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1e2428]">
          {leaves.length === 0 ? (
            <div className="p-10 text-center"><p className="text-lg font-semibold text-[#f0dfbd]">No leave records yet</p><p className="mt-3 text-sm text-white/50">Employee leave requests will appear here.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-white/45">
                  <tr>{["Employee","Type","Start","End","Reason","Status","Action"].map((head) => <th key={head} className="px-5 py-4">{head}</th>)}</tr>
                </thead>
                <tbody>
                  {leaves.map((item) => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="px-5 py-4 font-semibold text-[#f0dfbd]">{item.employeeName}</td>
                      <td className="px-5 py-4 text-white/60">{item.leaveType}</td>
                      <td className="px-5 py-4 text-white/60">{formatDate(item.startDate)}</td>
                      <td className="px-5 py-4 text-white/60">{formatDate(item.endDate)}</td>
                      <td className="px-5 py-4 text-white/60">{item.reason || "—"}</td>
                      <td className="px-5 py-4 text-white/60">{item.status}</td>
                      <td className="px-5 py-4">
                        {item.status === "pending" ? (
                          <div className="flex gap-2">
                            <button type="button" onClick={() => updateStatus(item.id, "approved")} className="rounded-full border border-green-400/30 px-4 py-2 text-xs text-green-200">Approve</button>
                            <button type="button" onClick={() => updateStatus(item.id, "rejected")} className="rounded-full border border-red-400/30 px-4 py-2 text-xs text-red-200">Reject</button>
                          </div>
                        ) : <span className="text-xs text-white/40">Completed</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
