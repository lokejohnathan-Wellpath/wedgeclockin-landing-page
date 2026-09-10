import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedge Works | Work better, together",
  description: "Practical people and business tools for teams that want to work with more clarity.",
};

const products = [
  ["WedgeCLOCKin", "PEOPLE & TIME", "◷", "Secure face and GPS attendance, leave, payroll-ready records and everyday workforce visibility.", "/employee-clockin", "Explore ClockIn"],
  ["Wedge-I", "CLEARER DECISIONS", "✦", "Turn operating numbers into priorities, forecasts and practical management insight.", "/wedge-i", "Open Wedge-I"],
  ["WedgeBooks", "CLEANER RECORDS", "▤", "Read real receipts and invoices, organise every line and export clean bookkeeping records.", "/wedge-i/books", "Open WedgeBooks"],
  ["WedgeWeb", "CUSTOMER PRESENCE", "⌂", "Build a professional website through a guided conversation and publish when ready.", "/wedgeweb", "Create Free Preview"],
  ["Wedge-SmartPOS", "CUSTOMER OPERATIONS", "◇", "Connect clients, appointments, services and counter operations for pet grooming and salon teams.", "/wedge-smartpos", "Discover SmartPOS"],
  ["Wedge-Supply ERP", "SUPPLY OPERATIONS", "↗", "Connect outlet requests, purchasing, kitchen production, warehouse stock and deliveries.", "/wedge-supply", "Open Supply ERP"],
] as const;

const principles = [
  ["▥", "Greater productivity", "Less admin, more progress."],
  ["◯", "Happier teams", "Give people the tools to succeed."],
  ["◇", "Accurate & reliable", "Built for real workplaces."],
  ["⌁", "A brighter tomorrow", "Healthy teams build stronger businesses."],
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f4f0e8] text-[#17202a]">
      <div className="min-h-screen px-3 py-3 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-[1280px] overflow-hidden rounded-[22px] border border-[#e8dfd0] bg-[#fffdfa] shadow-[0_28px_90px_rgba(78,58,28,.13)]">
          <header className="relative z-20 mx-auto flex max-w-[1180px] items-center justify-between px-6 py-6 sm:px-10">
            <a href="#top" className="flex items-center gap-3"><span className="text-3xl font-black leading-none tracking-[-.18em] text-[#ae7d2b]">W</span><span className="text-base font-bold tracking-tight">Wedge Works</span></a>
            <nav className="hidden items-center gap-7 text-sm font-medium text-[#53606b] lg:flex"><a href="#products" className="hover:text-[#a77528]">Products</a><a href="#solutions" className="hover:text-[#a77528]">Solutions</a><a href="#principles" className="hover:text-[#a77528]">About</a></nav>
            <a href="/manager-login" className="rounded-xl bg-[#ae7d2b] px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(174,125,43,.18)] transition hover:bg-[#91651f] sm:px-5">Manager Login</a>
          </header>
          <section id="top" className="relative isolate min-h-[510px] px-6 pb-12 pt-12 sm:px-10 sm:pb-16 sm:pt-16 lg:px-16 lg:pb-20 lg:pt-20">
            <div className="pointer-events-none absolute inset-0 bg-[url('/landing/corporate-frontdesk.png')] bg-cover bg-center" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,253,250,.96)_0%,rgba(255,253,250,.89)_36%,rgba(255,253,250,.54)_61%,rgba(255,253,250,.10)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#fffdfa] to-transparent" />
            <div className="relative z-10 max-w-[670px]"><h1 className="text-4xl font-semibold leading-[1.04] tracking-[-.055em] sm:text-6xl lg:text-7xl">Smarter attendance <span className="text-[#a77528]">for stronger teams.</span></h1><p className="mt-6 max-w-[560px] text-base leading-7 text-[#66717b] sm:text-lg">Wedge Works brings people, time and daily operations into one simple system—so teams can work with clarity and businesses can keep moving forward.</p><div className="mt-8 flex flex-wrap gap-3"><a href="/clock-in" className="rounded-xl bg-[#ae7d2b] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(174,125,43,.2)] hover:bg-[#91651f]">Start Free <span className="ml-2">→</span></a><a href="#products" className="rounded-xl border border-[#c69b54] px-6 py-3.5 text-sm font-bold text-[#6e5938] hover:bg-[#fbf4e8]">Explore Platform</a></div></div>
          </section>
          <section id="products" className="border-t border-[#eee4d5] bg-[#fffdfa] px-6 py-10 sm:px-10 lg:px-16"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{products.map(([name,label,icon,text,href,action]) => <article key={name} className="group rounded-2xl border border-[#eee5d8] bg-white p-6 shadow-[0_8px_22px_rgba(74,57,29,.035)] transition hover:-translate-y-1 hover:border-[#ddc595] hover:shadow-[0_18px_35px_rgba(91,66,24,.1)]"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f5f0e6] text-2xl text-[#a77528]">{icon}</div><p className="mt-5 text-[10px] font-black tracking-[.19em] text-[#a77528]">{label}</p><h2 className="mt-2 text-xl font-bold tracking-tight">{name}</h2><p className="mt-3 min-h-[68px] text-sm leading-5 text-[#6d7680]">{text}</p><a href={href} className="mt-5 inline-flex text-sm font-bold text-[#a06e23] transition group-hover:translate-x-1">{action}<span className="ml-2">→</span></a></article>)}</div></section>
          <section id="solutions" className="border-t border-[#eee4d5] px-6 py-11 sm:px-10 lg:px-16"><div className="grid gap-5 rounded-2xl bg-[#f7f2e8] p-6 sm:grid-cols-2 sm:p-8 lg:grid-cols-3"><div><p className="text-[10px] font-black tracking-[.22em] text-[#a77528]">ONE PRACTICAL ECOSYSTEM</p><h2 className="mt-3 text-2xl font-semibold tracking-[-.035em]">Start with what the team needs today.</h2></div><p className="text-sm leading-6 text-[#69737d]">Clock in securely, understand the numbers, build better customer relationships and make daily operations easier to run.</p><div className="flex items-center sm:justify-end"><a href="/clock-in" className="rounded-xl border border-[#cda760] px-5 py-3 text-sm font-bold text-[#7b5720] hover:bg-white">Try WedgeCLOCKin</a></div></div></section>
          <section id="principles" className="grid border-t border-[#eee4d5] sm:grid-cols-2 lg:grid-cols-4">{principles.map(([icon,title,text]) => <article key={title} className="flex gap-4 border-b border-[#eee4d5] px-6 py-7 last:border-b-0 sm:border-r sm:[&:nth-child(2n)]:border-r-0 lg:border-b-0 lg:[&:nth-child(2n)]:border-r lg:last:border-r-0"><span className="text-2xl text-[#ad7e2e]">{icon}</span><div><h2 className="text-sm font-bold">{title}</h2><p className="mt-1 text-sm leading-5 text-[#747c83]">{text}</p></div></article>)}</section>
          <footer className="border-t border-[#eee4d5] bg-[#fcfaf6] px-6 py-8 sm:px-10 lg:px-16"><div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-lg font-bold tracking-tight">Wedge Works</p></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#6d767c]"><a href="/privacy" className="hover:text-[#a77528]">Privacy</a><a href="/terms" className="hover:text-[#a77528]">Terms</a><a href="/disclaimer" className="hover:text-[#a77528]">Disclaimer</a><a href="/manager-login" className="font-semibold text-[#8e6427]">Manager Login</a></div></div><p className="mt-7 border-t border-[#eee4d5] pt-5 text-xs text-[#9a9b95]">© {new Date().getFullYear()} Wedge Works. All rights reserved.</p></footer>
        </div>
      </div>
    </main>
  );
}
