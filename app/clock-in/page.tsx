import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "WedgeCLOCKin | Face + GPS Attendance for Malaysian SMEs",
  description:
    "Verified staff attendance, manager-controlled overtime and payroll-ready records. Try WedgeCLOCKin free for 30 days.",
};

const benefits = [
  ["Two-layer attendance evidence", "Every attendance action requires a current employee selfie and workplace GPS verification."],
  ["Manager-controlled overtime", "Recorded overtime remains subject to manager review and approval before payroll handling."],
  ["One operating record", "Connect roster, attendance, rest periods, leave, OT, corrections, payroll and payslips."],
];

const steps = [
  ["1", "Register the company", "Create the private manager account and workplace profile."],
  ["2", "Add the team", "The trial includes up to five active staff and requires no biometric machine."],
  ["3", "Begin the next shift", "Employees clock in from their phones while managers retain oversight."],
];

export default function ClockInMarketingPage() {
  return (
    <main className="min-h-screen bg-[#0b1013] text-[#f3efe7]">
      <header className="border-b border-white/8 bg-[#0d1316]/95 px-5 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-[#d2aa62] font-black text-[#0d1316]">W</span>
            <span><b className="block text-[#f1dfbc]">WedgeCLOCKin</b><small className="tracking-[.14em] text-white/35">WEDGE WORKS</small></span>
          </Link>
          <Link href="/manager-login" className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold">Manager Login</Link>
        </div>
      </header>

      <section className="overflow-hidden px-5 py-16 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <p className="text-xs font-bold tracking-[.28em] text-[#d2aa62]">FOR MALAYSIAN SMEs</p>
            <h1 className="mt-6 max-w-3xl font-serif text-5xl leading-[1.05] sm:text-7xl">Clock-in evidence.<br />OT under control.</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/60">Verified attendance using employee face and workplace GPS, with manager-controlled overtime and payroll-ready records—without biometric hardware.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/manager-signup" className="rounded-md bg-[#d2aa62] px-7 py-4 font-bold text-[#0d1316]">Start 30-Day Free Trial</Link>
              <Link href="/manager-login" className="rounded-md border border-[#5e8983]/65 px-7 py-4 font-semibold text-[#b9d7d2]">Manager Login</Link>
            </div>
            <p className="mt-4 text-sm text-white/35">No credit card · Five active staff during trial · No hardware purchase</p>
          </div>

          <aside className="rounded-[2rem] border border-[#d2aa62]/25 bg-[#151c20] p-7 shadow-[0_35px_90px_rgba(0,0,0,.35)] sm:p-9">
            <p className="text-xs font-bold tracking-[.2em] text-[#d2aa62]">SIMPLE COMPANY PACKAGE</p>
            <div className="mt-6 flex items-end gap-2"><span className="text-6xl font-black text-[#f1dfbc]">RM39</span><span className="pb-2 text-white/40">/ month</span></div>
            <p className="mt-3 text-white/55">One company · Up to 12 active staff</p>
            <ul className="mt-7 space-y-3 text-sm text-white/60">
              <li>✓ Face and workplace GPS verification</li>
              <li>✓ Roster, attendance and rest periods</li>
              <li>✓ Leave, OT approval and payroll records</li>
              <li>✓ Manager and employee mobile access</li>
              <li>✓ RM390 annual option</li>
            </ul>
            <Link href="/manager-signup" className="mt-8 block rounded-full bg-[#d2aa62] px-6 py-4 text-center font-bold text-[#0d1316]">Try It Free</Link>
          </aside>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[#10171a] px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold tracking-[.24em] text-[#d2aa62]">WHY WEDGECLOCKIN</p>
          <h2 className="mt-4 max-w-2xl font-serif text-4xl sm:text-5xl">Protect honest staff and give managers a defensible record.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {benefits.map(([title, text]) => <article key={title} className="rounded-2xl border border-white/8 bg-white/[.025] p-6"><h3 className="text-xl font-bold text-[#f1dfbc]">{title}</h3><p className="mt-4 text-sm leading-7 text-white/50">{text}</p></article>)}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold tracking-[.24em] text-[#d2aa62]">START WITHOUT DISRUPTION</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">{steps.map(([number,title,text])=><article key={number} className="rounded-2xl border border-white/8 p-6"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#d2aa62] font-black text-[#0d1316]">{number}</span><h3 className="mt-5 text-xl font-bold text-[#f1dfbc]">{title}</h3><p className="mt-3 text-sm leading-7 text-white/50">{text}</p></article>)}</div>
          <div className="mt-12 rounded-[2rem] border border-[#5e8983]/35 bg-[#151c20] p-8 text-center sm:p-12"><h2 className="font-serif text-4xl">Ready for the next shift?</h2><p className="mx-auto mt-4 max-w-xl leading-7 text-white/50">Set up the company, add five trial staff and begin using real attendance records before deciding.</p><Link href="/manager-signup" className="mt-7 inline-block rounded-full bg-[#d2aa62] px-8 py-4 font-bold text-[#0d1316]">Start Free Trial</Link></div>
        </div>
      </section>

      <footer className="border-t border-white/8 bg-[#080c0f] px-5 py-8 text-sm text-white/40">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4"><p>© {new Date().getFullYear()} Wedge Works.</p><div className="flex flex-wrap gap-4"><Link href="/privacy">Privacy Policy</Link><Link href="/terms">Terms of Use</Link><Link href="/disclaimer">Disclaimer</Link><Link href="/manager-login">Manager Login</Link></div></div>
      </footer>
    </main>
  );
}
