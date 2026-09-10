import Link from "next/link";

import { demoManagedClients, demoMonthlyFiles, demoWorkItems } from "./demoData";

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(value);
}

function monthLabel(month: number, year: number) {
  return new Intl.DateTimeFormat("en-MY", { month: "short", year: "numeric" }).format(new Date(year, month - 1, 1));
}

function statusTone(status: string) {
  if (["complete", "reconciled", "closed", "ready"].includes(status)) return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  if (["review_required", "exceptions", "processing", "matching"].includes(status)) return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  if (["waiting_client", "statement_missing"].includes(status)) return "border-red-400/20 bg-red-400/10 text-red-200";
  return "border-white/10 bg-white/[0.04] text-white/55";
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function ManagedAccountsControlPage() {
  const criticalCount = demoWorkItems.filter((item) => item.severity === "critical").length;
  const reviewCount = demoWorkItems.filter((item) => item.severity === "review").length;
  const awaitingClient = demoMonthlyFiles.filter((file) => file.missingDocumentCount > 0).length;
  const reconciled = demoMonthlyFiles.filter((file) => ["reconciled", "closed"].includes(file.bankReconciliation)).length;

  return (
    <main className="min-h-screen bg-[#090d10] text-[#f4efe6]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(183,145,80,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(72,89,91,0.13),transparent_30%)]" />

      <div className="relative mx-auto max-w-[1600px] px-5 py-7 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link href="/wedge-i" className="text-sm font-medium text-[#c8a467] hover:text-[#ead3a8]">← Wedge-I</Link>
            <p className="mt-5 text-xs font-semibold tracking-[0.28em] text-[#c8a467]">WEDGE MANAGED ACCOUNTS</p>
            <h1 className="mt-3 text-4xl font-semibold text-[#f1dfbc]">Accounts Control Centre</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">
              One operating view for managed-account clients, WedgeBooks, WedgeCLOCKin, bank reconciliation, month-end review and P&amp;L readiness.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[#c8a467]/25 bg-[#c8a467]/10 px-4 py-2 text-[#e5c98f]">Operator view</span>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-white/50">Foundation preview</span>
          </div>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Managed clients" value={String(demoManagedClients.length)} detail="Designed to scale to 50+" />
          <Metric label="Critical actions" value={String(criticalCount)} detail="Resolve first" />
          <Metric label="Awaiting client" value={String(awaitingClient)} detail="Missing documents / inputs" />
          <Metric label="Bank reconciled" value={`${reconciled}/${demoMonthlyFiles.length}`} detail="Current monthly files" />
        </section>

        <section className="mt-8 grid gap-7 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,.8fr)]">
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#11171b]/95">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">CLIENT PORTFOLIO</p>
                <h2 className="mt-2 text-xl font-semibold text-[#f1dfbc]">Monthly accounting status</h2>
              </div>
              <button className="rounded-full bg-[#c8a467] px-5 py-2.5 text-xs font-bold text-[#111416]">+ Add client</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-white/8 text-[11px] uppercase tracking-[0.12em] text-white/35">
                  <tr>
                    <th className="px-6 py-4">Client</th>
                    <th className="px-4 py-4">Month</th>
                    <th className="px-4 py-4">Books</th>
                    <th className="px-4 py-4">Payroll</th>
                    <th className="px-4 py-4">Bank</th>
                    <th className="px-4 py-4">P&amp;L</th>
                    <th className="px-4 py-4">Issues</th>
                    <th className="px-4 py-4">Assigned</th>
                  </tr>
                </thead>
                <tbody>
                  {demoManagedClients.map((client) => {
                    const file = demoMonthlyFiles.find((item) => item.businessId === client.businessId);
                    if (!file) return null;
                    return (
                      <tr key={client.businessId} className="border-b border-white/[0.06] last:border-0">
                        <td className="px-6 py-5">
                          <div className="font-semibold text-white/90">{client.tradingName || client.legalName}</div>
                          <div className="mt-1 text-xs text-white/35">{client.businessId} · {client.companyCode} · {client.employeeCount} staff</div>
                          <div className="mt-1 text-xs text-[#c8a467]/75">{client.industry}</div>
                        </td>
                        <td className="px-4 py-5 text-white/60">{monthLabel(file.month, file.year)}</td>
                        <StatusCell value={file.books} />
                        <StatusCell value={file.payroll} />
                        <StatusCell value={file.bankReconciliation} />
                        <StatusCell value={file.pnl} />
                        <td className="px-4 py-5">
                          <div className="font-semibold text-white/80">{file.missingDocumentCount + file.bankExceptionCount}</div>
                          {file.reconciliationDifference !== 0 ? <div className="mt-1 text-xs text-red-200">Diff {money(file.reconciliationDifference)}</div> : <div className="mt-1 text-xs text-emerald-200/70">No difference</div>}
                        </td>
                        <td className="px-4 py-5 text-xs text-white/50">{client.assignedAccountsExecutive || "Unassigned"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-7">
            <section className="rounded-[28px] border border-[#c8a467]/20 bg-[#12181c]/95 p-6">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">TODAY&apos;S WORK QUEUE</p>
              <h2 className="mt-2 text-xl font-semibold text-[#f1dfbc]">Work the exceptions</h2>
              <div className="mt-5 space-y-3">
                {demoWorkItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${item.severity === "critical" ? "border-red-400/25 bg-red-400/10 text-red-200" : item.severity === "attention" ? "border-amber-300/25 bg-amber-300/10 text-amber-100" : "border-sky-300/20 bg-sky-300/10 text-sky-100"}`}>{item.severity}</span>
                      <span className="text-[10px] text-white/30">{item.businessId}</span>
                    </div>
                    <div className="mt-3 font-semibold text-white/85">{item.title}</div>
                    <p className="mt-2 text-xs leading-5 text-white/45">{item.detail}</p>
                    <p className="mt-3 text-[11px] text-[#c8a467]/70">{item.assignedTo || "Unassigned"}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-xs leading-5 text-white/35">The production queue will be generated from client monthly files, WedgeBooks exceptions and bank reconciliation status.</p>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-[#11171b]/95 p-6">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">ACCESS MODEL</p>
              <div className="mt-4 space-y-3 text-sm text-white/55">
                <Access title="Owner / client admin" text="Books, monthly sales, bank upload, reports and workforce tools." />
                <Access title="Manager" text="Attendance, employees, leave, OT and roster only." />
                <Access title="Employee" text="Company code + Staff ID + PIN for own clock-in and leave." />
                <Access title="Wedge accounts team" text="Assigned multi-client portfolio with review permissions." />
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#11171b]/90 p-5"><p className="text-xs uppercase tracking-[0.14em] text-white/35">{label}</p><div className="mt-3 text-3xl font-semibold text-[#f1dfbc]">{value}</div><p className="mt-2 text-xs text-white/35">{detail}</p></div>;
}

function StatusCell({ value }: { value: string }) {
  return <td className="px-4 py-5"><span className={`inline-flex rounded-full border px-3 py-1.5 text-[11px] font-semibold ${statusTone(value)}`}>{statusLabel(value)}</span></td>;
}

function Access({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl border border-white/8 bg-white/[0.025] p-3"><div className="font-semibold text-white/75">{title}</div><div className="mt-1 text-xs leading-5 text-white/40">{text}</div></div>;
}
