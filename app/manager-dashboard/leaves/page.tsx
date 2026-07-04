"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  return new Date(value).toLocaleDateString();
}

export default function LeaveApprovalPage() {
  const router = useRouter();

  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadLeaves() {
    const token = localStorage.getItem("wc_manager_token");
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

    if (!token) {
      router.push("/manager-login");
      return;
    }

    if (!apiBaseUrl) {
      setMessage("Service is not ready.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(apiBaseUrl + "/api/manager/leaves", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage("Leave records could not be loaded.");
        setLoading(false);
        return;
      }

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
      const response = await fetch(
        apiBaseUrl + "/api/manager/leaves/" + id + "/status",
        {
          method: "PUT",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        setMessage("Leave status could not be updated.");
        return;
      }

      setLeaves((current) =>
        current.map((item) =>
          item.id === id ? { ...item, status: status } : item
        )
      );

      setMessage(status === "approved" ? "Leave approved." : "Leave rejected.");
    } catch {
      setMessage("Leave status could not be updated.");
    }
  }

  useEffect(() => {
    loadLeaves();
  }, []);

  const pending = leaves.filter((item) => item.status === "pending").length;
  const approved = leaves.filter((item) => item.status === "approved").length;
  const rejected = leaves.filter((item) => item.status === "rejected").length;

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm tracking-[0.35em] text-[#d4ad63]">
              WEDGECLOCKIN
            </p>
            <h1 className="mt-2 text-4xl font-bold text-[#f0dfbd]">
              Leave Approval
            </h1>
            <p className="mt-2 text-white/55">
              Review and update employee leave requests.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/manager-dashboard")}
            className="rounded-full border border-[#d4ad63]/50 px-6 py-3 font-semibold text-[#f0dfbd] hover:bg-white/5"
          >
            Back
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[#d4ad63]/25 bg-white/5 p-5">
            <p className="text-sm text-white/45">Total</p>
            <p className="mt-2 text-3xl font-bold text-[#d4ad63]">
              {leaves.length}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/5 p-5">
            <p className="text-sm text-white/45">Pending</p>
            <p className="mt-2 text-3xl font-bold text-yellow-200">
              {pending}
            </p>
          </div>

          <div className="rounded-2xl border border-green-400/20 bg-green-500/5 p-5">
            <p className="text-sm text-white/45">Approved</p>
            <p className="mt-2 text-3xl font-bold text-green-200">
              {approved}
            </p>
          </div>

          <div className="rounded-2xl border border-red-400/20 bg-red-500/5 p-5">
            <p className="text-sm text-white/45">Rejected</p>
            <p className="mt-2 text-3xl font-bold text-red-200">{rejected}</p>
          </div>
        </div>

        {(loading || message) && (
          <div className="mt-8 rounded-[2rem] border border-[#d4ad63]/30 bg-[#1e2428] p-5 text-sm text-white/60">
            {loading ? "Loading leave records..." : message}
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1e2428]">
          {leaves.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-lg font-semibold text-[#f0dfbd]">
                No leave records yet
              </p>
              <p className="mt-3 text-sm text-white/50">
                Employee leave requests will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-white/45">
                  <tr>
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Start</th>
                    <th className="px-5 py-4">End</th>
                    <th className="px-5 py-4">Reason</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {leaves.map((item) => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="px-5 py-4 font-semibold text-[#f0dfbd]">
                        {item.employeeName}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {item.leaveType}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {formatDate(item.startDate)}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {formatDate(item.endDate)}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {item.reason || "—"}
                      </td>
                      <td className="px-5 py-4 text-white/60">
                        {item.status}
                      </td>
                      <td className="px-5 py-4">
                        {item.status === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updateStatus(item.id, "approved")}
                              className="rounded-full border border-green-400/30 px-4 py-2 text-xs text-green-200"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(item.id, "rejected")}
                              className="rounded-full border border-red-400/30 px-4 py-2 text-xs text-red-200"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-white/40">
                            Completed
                          </span>
                        )}
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