"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { downloadSimpleXlsx } from "../../lib/simpleXlsx";

type LeaveItem = {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  createdAt?: string;
};

type EmployeeItem = {
  id: string;
  employeeCode?: string;
  fullName: string;
  department?: string;
  employmentStartDate?: string;
  isActive?: boolean;
};

function malaysiaDateKey(value: Date | string = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDate(value: string | undefined) {
  if (!value) return "—";
  const key = malaysiaDateKey(value);
  return key || "—";
}

function inclusiveDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00+08:00`);
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00+08:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}

function safeFilePart(value: string) {
  return value.trim().replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "employee";
}

export default function LeaveApprovalPage() {
  const router = useRouter();
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [exporting, setExporting] = useState(false);

  async function loadLeaves() {
    const token = localStorage.getItem("wc_manager_token");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!token) { router.push("/manager-login"); return; }
    if (!apiBaseUrl) { setMessage("Service is not ready."); setLoading(false); return; }

    try {
      const headers = { Authorization: "Bearer " + token };
      const [leaveResponse, employeeResponse] = await Promise.all([
        fetch(apiBaseUrl + "/api/manager/leaves", { headers, cache: "no-store" }),
        fetch(apiBaseUrl + "/api/manager/employees", { headers, cache: "no-store" }),
      ]);
      const [leaveData, employeeData] = await Promise.all([leaveResponse.json(), employeeResponse.json()]);

      if (!leaveResponse.ok || !employeeResponse.ok) {
        setMessage("Leave or employee records could not be loaded.");
        setLoading(false);
        return;
      }

      setLeaves(leaveData.leaves || []);
      setEmployees(employeeData.employees || []);
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

  const employeesWithLeave = useMemo(() => {
    const ids = new Set(leaves.map((item) => item.employeeId).filter(Boolean));
    return employees
      .filter((employee) => ids.has(employee.id))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [employees, leaves]);

  useEffect(() => {
    if (!selectedEmployeeId && employeesWithLeave.length) setSelectedEmployeeId(employeesWithLeave[0].id);
  }, [employeesWithLeave, selectedEmployeeId]);

  const pending = leaves.filter((item) => item.status === "pending").length;
  const approved = leaves.filter((item) => item.status === "approved").length;
  const rejected = leaves.filter((item) => item.status === "rejected").length;

  async function exportSelectedEmployee() {
    const employee = employees.find((item) => item.id === selectedEmployeeId);
    if (!employee) { setMessage("Select an employee first."); return; }

    const reportDate = malaysiaDateKey();
    const employmentStartDate = formatDate(employee.employmentStartDate);
    const startKey = employee.employmentStartDate ? malaysiaDateKey(employee.employmentStartDate) : "";

    const records = leaves
      .filter((item) => item.employeeId === employee.id)
      .filter((item) => {
        if (!startKey) return true;
        const serviceReference = malaysiaDateKey(item.createdAt || item.startDate);
        return !serviceReference || serviceReference >= startKey;
      })
      .sort((a, b) => malaysiaDateKey(a.startDate).localeCompare(malaysiaDateKey(b.startDate)));

    setExporting(true);
    setMessage("");

    try {
      const approvedCount = records.filter((item) => item.status === "approved").length;
      const pendingCount = records.filter((item) => item.status === "pending").length;
      const rejectedCount = records.filter((item) => item.status === "rejected").length;
      const totalDays = records.reduce((sum, item) => sum + inclusiveDays(item.startDate, item.endDate), 0);

      const leaveTypeSummary = Array.from(new Set(records.map((item) => item.leaveType))).sort().map((leaveType) => {
        const matching = records.filter((item) => item.leaveType === leaveType);
        return [
          leaveType,
          matching.length,
          matching.reduce((sum, item) => sum + inclusiveDays(item.startDate, item.endDate), 0),
          matching.filter((item) => item.status === "approved").length,
          matching.filter((item) => item.status === "pending").length,
          matching.filter((item) => item.status === "rejected").length,
        ];
      });

      await downloadSimpleXlsx(
        `wedge-leave-service-history-${safeFilePart(employee.employeeCode || employee.fullName)}-${reportDate}.xlsx`,
        "Leave Service History",
        [
          ["Wedge CLOCKin - Individual Leave Management Service History"],
          ["Employee", employee.fullName],
          ["Employee Code", employee.employeeCode || "—"],
          ["Department", employee.department || "—"],
          ["Employment Start Date", employmentStartDate],
          ["Report Date", reportDate],
          ["Total Leave Records", records.length],
          ["Total Leave Days Requested", totalDays],
          ["Approved Records", approvedCount],
          ["Pending Records", pendingCount],
          ["Rejected Records", rejectedCount],
          [],
          ["Leave Type Summary"],
          ["Leave Type", "Records", "Days", "Approved", "Pending", "Rejected"],
          ...leaveTypeSummary,
          [],
          ["Full Leave History"],
          ["Leave Type", "Start Date", "End Date", "Days", "Reason", "Status", "Request Date"],
          ...records.map((item) => [
            item.leaveType,
            formatDate(item.startDate),
            formatDate(item.endDate),
            inclusiveDays(item.startDate, item.endDate),
            item.reason || "—",
            item.status,
            formatDate(item.createdAt),
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
            <p className="mt-2 text-white/55">Review employee leave requests and export individual service-history reports.</p>
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
              <select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]">
                {employeesWithLeave.length === 0 ? <option value="">No employees with leave records</option> : employeesWithLeave.map((employee) => <option key={employee.id} value={employee.id}>{employee.fullName}{employee.employeeCode ? ` · ${employee.employeeCode}` : ""}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => void exportSelectedEmployee()} disabled={!selectedEmployeeId || exporting} className="h-11 min-w-40 rounded-full bg-[#d4ad63] px-6 font-bold text-[#101416] transition hover:bg-[#e2be73] disabled:opacity-50">
              {exporting ? "Preparing…" : "Download Excel"}
            </button>
          </div>
          <p className="mt-3 text-xs text-white/45">The workbook covers the selected employee&apos;s retained leave history from employment start date through the report date, with totals by leave type and status.</p>
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
                            <button type="button" onClick={() => updateStatus(item.id, "approved")} className="h-9 min-w-20 rounded-full border border-green-400/30 px-4 text-xs text-green-200">Approve</button>
                            <button type="button" onClick={() => updateStatus(item.id, "rejected")} className="h-9 min-w-20 rounded-full border border-red-400/30 px-4 text-xs text-red-200">Reject</button>
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
