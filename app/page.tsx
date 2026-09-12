import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedge Works | Managed back office for SMEs",
  description: "Wedge helps SMEs keep workforce records, source documents, bookkeeping, reconciliation and management reporting organised.",
};

const flow = [
  ["1", "Run the business", "Maintain staff, roster, leave and overtime in WedgeCLOCKin."],
  ["2", "Send the records", "Scan receipts and invoices from your phone. Send monthly sales and bank statements to Wedge."],
  ["3", "Wedge runs the back office", "We organise the books, reconcile the month, track outstanding items and prepare management reporting."],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f0e8] text-[#17202a]">
      <div className="min-h-screen px-3 py-3 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[22px] border border-[#e8dfd0] bg-[#fffdfa] shadow-[0_28px_90px_rgba(78,58,28,.13)]">
          <header className="relative z-20 mx-auto flex max-w-[1180px] items-center justify-between px-6 py-6 sm:px-10">
            <a href="#top" className="flex items-center gap-3"><span className="text-3xl font-black leading-none tracking-[-.18em] text-[#ae7d2b]">W</span><span className="text-base font-bold tracking-tight">Wedge Works</span></a>
            <nav className="hidden items-center gap-7 text-sm font-medium text-[#53606b] md:flex"><a href="#how" className="hover:text-[#a77528]">How it works</a><a href="#service" className="hover:text-[#a77528]">Managed service</a></nav>
            <a href="/manager-login" className="rounded-xl bg-[#ae7d2b] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(174,125,43,.18)] transition hover:bg-[#91651f] sm:px-5">Business Login</a>
          </header>

          <section id="top" className="relative isolate min-h-[540px] px-6 pb-12 pt-14 sm:px-10 sm:pb-16 sm:pt-20 lg:px-16 lg:pb-20 lg:pt-24">
            <div className="pointer-events-none absolute inset-0 bg-[url('/landing/corporate-frontdesk.png')] bg-cover bg-center" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,253,250,.97)_0%,rgba(255,253,250,.92)_40%,rgba(255,253,250,.56)_67%,rgba(255,253,250,.16)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#fffdfa] to-transparent" />
            <div className="relative z-10 max-w-[720px]">
              <p className="text-xs font-black tracking-[.22em] text-[#a77528]">MANAGED BACK OFFICE FOR SMEs</p>
              <h1 className="mt-4 text-4xl font-semibold leading-[1.04] tracking-[-.055em] sm:text-6xl lg:text-7xl">You run the business. <span className="text-[#a77528]">Wedge runs the back office.</span></h1>
              <p className="mt-6 max-w-[600px] text-base leading-7 text-[#66717b] sm:text-lg">Your team handles daily operations. Wedge helps organise source documents, payroll information, bookkeeping, reconciliation and monthly management reporting behind the scenes.</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="/manager-login" className="rounded-xl bg-[#ae7d2b] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(174,125,43,.2)] hover:bg-[#91651f]">Business Operations Login →</a><a href="/employee-clockin" className="rounded-xl border border-[#c69b54] px-6 py-3.5 text-sm font-bold text-[#6e5938] hover:bg-[#fbf4e8]">Employee Clock-In</a></div>
            </div>
          </section>

          <section id="how" className="border-t border-[#eee4d5] bg-[#fffdfa] px-6 py-12 sm:px-10 lg:px-16">
            <div className="max-w-2xl"><p className="text-[10px] font-black tracking-[.22em] text-[#a77528]">SIMPLE CLIENT WORKFLOW</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.035em]">Keep your side simple.</h2><p className="mt-3 text-sm leading-6 text-[#69737d]">Business owners do not need to learn an accounting system. Keep staff records current, capture source documents, and provide the monthly sales and bank records Wedge needs.</p></div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">{flow.map(([number,title,text]) => <article key={number} className="rounded-2xl border border-[#eee5d8] bg-white p-6 shadow-[0_8px_22px_rgba(74,57,29,.035)]"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#f1e8d7] text-sm font-black text-[#9d6e25]">{number}</span><h3 className="mt-5 text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-[#6d7680]">{text}</p></article>)}</div>
          </section>

          <section id="service" className="border-t border-[#eee4d5] px-6 py-12 sm:px-10 lg:px-16">
            <div className="grid gap-6 rounded-[28px] bg-[#20282c] p-7 text-white sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
              <div><p className="text-[10px] font-black tracking-[.22em] text-[#d8b97a]">WHAT WEDGE HANDLES</p><h2 className="mt-3 font-serif text-4xl text-[#f2e1bd]">A cleaner month end.</h2><p className="mt-4 text-sm leading-6 text-white/60">Wedge uses the records supplied by the business to help the back-office team reconcile transactions, identify missing or outstanding items and prepare management information.</p></div>
              <div className="grid gap-3 sm:grid-cols-2"><Service text="Bookkeeping & source-document review"/><Service text="WedgeCLOCKin payroll integration"/><Service text="Bank reconciliation & exceptions"/><Service text="Payables, accruals & timing items"/><Service text="Monthly management P&L"/><Service text="Word / PDF management report"/></div>
            </div>
          </section>

          <footer className="border-t border-[#eee4d5] bg-[#fcfaf6] px-6 py-8 sm:px-10 lg:px-16"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-lg font-bold tracking-tight">Wedge Works</p><p className="mt-1 text-xs text-[#8a9294]">Managed back-office operations</p></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#6d767c]"><a href="/privacy" className="hover:text-[#a77528]">Privacy</a><a href="/terms" className="hover:text-[#a77528]">Terms</a><a href="/disclaimer" className="hover:text-[#a77528]">Disclaimer</a><a href="/manager-login" className="font-semibold text-[#8e6427]">Business Login</a><a href="/employee-clockin" className="font-semibold text-[#8e6427]">Employee Clock-In</a></div></div><p className="mt-7 border-t border-[#eee4d5] pt-5 text-xs text-[#9a9b95]">© {new Date().getFullYear()} Wedge Works. All rights reserved.</p></footer>
        </div>
      </div>
    </main>
  );
}

function Service({ text }: { text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm font-semibold text-white/75"><span className="mr-2 text-[#d8b97a]">✓</span>{text}</div>;
}
