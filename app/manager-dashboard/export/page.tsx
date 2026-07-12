"use client";

import { useRouter } from "next/navigation";

const exports = [
  {
    title: "Attendance",
    description:
      "Export all attendance records for the selected period.",
    endpoint: "/api/attendance/export",
  },
  {
    title: "Employees",
    description:
      "Export the complete employee directory.",
    endpoint: "/api/employees/export",
  },
  {
    title: "Leave",
    description:
      "Export leave applications and balances.",
    endpoint: "/api/leaves/export",
  },
  {
    title: "Payroll",
    description:
      "Export payroll records for Excel processing.",
    endpoint: "/api/payroll/export",
  },
];

export default function ExportPage() {
  const router = useRouter();

  async function download(endpoint: string) {
    const api = process.env.NEXT_PUBLIC_API_BASE_URL;

    const token = localStorage.getItem("wc_manager_token");

    if (!api || !token) {
      alert("Login session has expired.");
      return;
    }

    try {
      const response = await fetch(`${api}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error();
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = "export.xlsx";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch {
      alert(
        "Export endpoint is not connected yet. Backend integration is the next step.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto max-w-7xl px-6 py-10">

        <button
          onClick={() => router.push("/manager-dashboard")}
          className="text-[#d4ad63] hover:underline"
        >
          ← Back to Manager Dashboard
        </button>

        <p className="mt-8 text-sm tracking-[0.35em] text-[#d4ad63]">
          EXPORT CENTRE
        </p>

        <h1 className="mt-3 text-5xl font-bold text-[#f0dfbd]">
          CSV / Excel Export
        </h1>

        <p className="mt-3 max-w-3xl text-white/60">
          Download company data for payroll processing,
          auditing, reporting and external accounting systems.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">

          {exports.map((item) => (
            <div
              key={item.title}
              className="rounded-[30px] border border-[#d4ad63]/25 bg-[#1d2327] p-8"
            >
              <h2 className="text-2xl font-bold text-[#f0dfbd]">
                {item.title}
              </h2>

              <p className="mt-3 text-white/60">
                {item.description}
              </p>

              <button
                onClick={() => download(item.endpoint)}
                className="mt-8 rounded-full bg-[#d4ad63] px-6 py-3 font-bold text-[#101416] transition hover:bg-[#e7c379]"
              >
                Export Excel
              </button>
            </div>
          ))}

        </div>

        <div className="mt-10 rounded-[30px] border border-white/10 bg-[#1d2327] p-8">

          <h2 className="text-2xl font-bold text-[#f0dfbd]">
            Coming Soon
          </h2>

          <ul className="mt-5 space-y-3 text-white/60">
            <li>• Scheduled monthly exports</li>
            <li>• Email payroll reports automatically</li>
            <li>• AutoCount integration</li>
            <li>• SQL Account integration</li>
            <li>• Bukku integration</li>
          </ul>

        </div>

      </section>
    </main>
  );
}s