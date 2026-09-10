import Link from "next/link";

const rows = [
  { date: "03 Sep 2026", bank: "CARD SETTLEMENT", amount: 53900, books: "Card clearing", status: "matched" },
  { date: "08 Sep 2026", bank: "TNB PAYMENT", amount: -3187.4, books: "Electricity expense", status: "matched" },
  { date: "14 Sep 2026", bank: "ABC HARDWARE", amount: -680, books: "No supporting document", status: "bank_only" },
  { date: "19 Sep 2026", bank: "GRAB SETTLEMENT", amount: 11620, books: "GrabFood clearing", status: "suggested" },
  { date: "25 Sep 2026", bank: "CHEQUE 001223", amount: -1240, books: "Supplier payment", status: "books_only" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-MY", { style: "currency", currency: "MYR" }).format(Math.abs(value));
}

function tone(status: string) {
  if (status === "matched") return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
  if (status === "suggested") return "border-amber-300/20 bg-amber-300/10 text-amber-100";
  if (status === "bank_only") return "border-red-400/20 bg-red-400/10 text-red-200";
  return "border-sky-300/20 bg-sky-300/10 text-sky-100";
}

function label(status: string) {
  if (status === "bank_only") return "Bank only";
  if (status === "books_only") return "Books only";
  return status[0].toUpperCase() + status.slice(1);
}

export default function ReconciliationWorkspacePage() {
  const statementBalance = 39630;
  const adjustedBookBalance = 38950;
  const difference = statementBalance - adjustedBookBalance;

  return (
    <main className="min-h-screen bg-[#090d10] px-5 py-8 text-[#f4efe6] sm:px-8">
      <div className="mx-auto max-w-[1500px]">
        <Link href="/wedge-i/accounts" className="text-sm font-medium text-[#c8a467] hover:text-[#ead3a8]">← Accounts Control Centre</Link>

        <header className="mt-6 flex flex-col gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-[#c8a467]">BANK RECONCILIATION</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#f1dfbc]">ABC Cafe · September 2026</h1>
            <p className="mt-3 text-sm text-white/45">Maybank Operating ····4421</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-amber-100">6 exceptions</span>
            <span className="rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-red-200">Difference {money(difference)}</span>
          </div>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Statement closing" value={money(statementBalance)} />
          <Metric label="Adjusted books" value={money(adjustedBookBalance)} />
          <Metric label="Auto matched" value="169" />
          <Metric label="Unresolved" value="18" />
        </section>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-white/10 bg-[#11171b]/95">
          <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">STATEMENT MATCHING</p>
              <p className="mt-2 text-sm text-white/45">Accountants work only on suggested, bank-only and books-only exceptions.</p>
            </div>
            <button className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-semibold text-white/70">Upload statement</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/8 text-[11px] uppercase tracking-[0.12em] text-white/35">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-4 py-4">Bank description</th>
                  <th className="px-4 py-4">Amount</th>
                  <th className="px-4 py-4">WedgeBooks match</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.date}-${index}`} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-6 py-5 text-white/50">{row.date}</td>
                    <td className="px-4 py-5 font-medium text-white/80">{row.bank}</td>
                    <td className={`px-4 py-5 font-semibold ${row.amount < 0 ? "text-red-200" : "text-emerald-200"}`}>{row.amount < 0 ? "-" : "+"}{money(row.amount)}</td>
                    <td className="px-4 py-5 text-white/50">{row.books}</td>
                    <td className="px-4 py-5"><span className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${tone(row.status)}`}>{label(row.status)}</span></td>
                    <td className="px-4 py-5"><button className="text-xs font-semibold text-[#c8a467]">{row.status === "matched" ? "View" : "Resolve"}</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-7 grid gap-7 lg:grid-cols-2">
          <div className="rounded-[26px] border border-white/10 bg-[#11171b]/95 p-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">RESTAURANT CLEARING</p>
            <div className="mt-5 space-y-3 text-sm">
              <Line label="Card collections" value="RM55,000.00" />
              <Line label="Less: merchant fee" value="RM1,100.00" />
              <Line label="Net bank settlement" value="RM53,900.00" />
              <Line label="Card clearing balance" value="RM0.00" strong />
            </div>
            <p className="mt-5 text-xs leading-5 text-white/35">The same clearing logic will be used for card processors, DuitNow/QR, GrabFood and Foodpanda before Wedge-I flags a genuine difference.</p>
          </div>

          <div className="rounded-[26px] border border-[#c8a467]/20 bg-[#12181c]/95 p-6">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#c8a467]">MONTH CLOSE GATE</p>
            <div className="mt-5 space-y-2 text-sm text-white/55">
              <Check ok label="Sales entered" />
              <Check ok label="Payroll imported from WedgeCLOCKin" />
              <Check ok={false} label="Bank reconciliation difference = RM0" />
              <Check ok={false} label="Missing supporting documents = 0" />
              <Check ok={false} label="Reviewer approval" />
            </div>
            <button disabled className="mt-6 w-full rounded-xl bg-[#c8a467] px-5 py-3.5 text-sm font-bold text-[#111416] opacity-40">CLOSE SEPTEMBER 2026</button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-white/10 bg-[#11171b]/90 p-5"><p className="text-xs uppercase tracking-[0.14em] text-white/35">{label}</p><div className="mt-3 text-2xl font-semibold text-[#f1dfbc]">{value}</div></div>;
}

function Line({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex items-center justify-between border-b border-white/[0.06] py-2 ${strong ? "font-semibold text-[#f1dfbc]" : "text-white/55"}`}><span>{label}</span><span>{value}</span></div>;
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"><span className={ok ? "text-emerald-300" : "text-amber-200"}>{ok ? "✓" : "!"}</span><span>{label}</span></div>;
}
