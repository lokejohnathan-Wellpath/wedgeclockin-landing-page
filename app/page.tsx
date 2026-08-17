import RotatingLaptop from "./components/RotatingLaptop";
import type { Metadata } from "next";
import { accountingDeskImage } from "./wedge-i/books/images";

export const metadata: Metadata = {
  title: "Wedge Works | Operate, Decide and Grow",
  description:
    "WedgeCLOCKin, Wedge-I, WedgeBooks, WedgeWeb, Wedge-SmartPOS and Wedge-Supply ERP bring practical operations into one growing platform.",
};

const products = [
  { name: "WedgeCLOCKin", eyebrow: "WORKFORCE", text: "Face and GPS attendance, leave, payroll-ready records and secure employee operations.", href: "/employee-clockin", action: "Explore ClockIn" },
  { name: "Wedge-I", eyebrow: "EXECUTIVE AI", text: "Turn operating numbers into forecasts, priorities and clearer management decisions.", href: "/wedge-i", action: "Open Wedge-I" },
  { name: "WedgeBooks", eyebrow: "AI BOOKKEEPING", text: "Read real receipts and invoices, isolate every line and export clean bookkeeping records.", href: "/wedge-i/books", action: "Open WedgeBooks" },
  { name: "WedgeWeb", eyebrow: "WEBSITE ENGINE", text: "Create a professional customer website through a guided conversation and publish when ready.", href: "/wedgeweb", action: "Create Free Preview" },
  { name: "Wedge-SmartPOS", eyebrow: "CUSTOMER OPERATIONS", text: "Connect clients, appointments, services and daily counter operations for pet grooming and salon/spa businesses.", href: "/wedge-smartpos", action: "Discover SmartPOS" },
  { name: "Wedge-Supply ERP", eyebrow: "SUPPLY OPERATIONS", text: "Connect outlet requests, centralized purchasing, kitchen production, warehouse stock and branch deliveries.", href: "/wedge-supply", action: "Open Supply ERP" },
];

const stories = [
  { eyebrow: "WEDGE-I + WEDGEBOOKS · EXECUTIVE CLARITY", title: "Understand the business. Keep every number in order.", text: "WedgeBooks turns receipts and invoices into clean bookkeeping records. Wedge-I brings those financial and operating signals together for clearer management decisions.", image: accountingDeskImage, dark: false, imageFirst: true, href: "/wedge-i/books", action: "Open WedgeBooks" },
  { eyebrow: "WEDGEWEB · CUSTOMER RELATIONSHIPS", title: "Strengthen business through stronger customer relationships.", text: "Build a professional web presence, guide enquiries into WhatsApp and prepare the foundation for a practical customer relationship workflow.", image: "/landing/ai-partnership.png", dark: true, imageFirst: false, href: "/wedgeweb", action: "Build with WedgeWeb" },
  { eyebrow: "WEDGE-SMARTPOS", title: "Connect your clients and manage every appointment.", text: "A focused POS and appointment experience for pet grooming, salons and spas—bringing customers, services, schedules and counter operations together.", image: "/landing/pet-services.png", secondImage: "/landing/salon-spa.png", dark: false, imageFirst: false, href: "/wedge-smartpos", action: "Wedge-SmartPOS" },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#0d1316] text-[#f3efe7]">
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <a href="#top" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d2aa62] font-black text-[#0d1316]">W</span><div><p className="font-semibold text-[#f1dfbc]">Wedge Works</p><p className="text-[10px] tracking-[.14em] text-white/40">OPERATE · DECIDE · GROW</p></div></a>
          <nav className="flex items-center text-sm"><a href="/manager-login" className="rounded-full border border-white/15 px-5 py-2.5 text-white transition hover:border-[#d2aa62]/60 hover:text-[#f1dfbc]">Manager Login</a></nav>
        </div>
      </header>

      <section id="top" className="relative min-h-[820px] border-b border-white/8 bg-[#080c0f] pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_25%,rgba(94,137,131,.2),transparent_30%),radial-gradient(circle_at_20%_45%,rgba(210,170,98,.11),transparent_35%),linear-gradient(125deg,#080c0f,#111a20_58%,#080c0f)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(168deg,transparent_48%,rgba(255,255,255,.04)_49%,rgba(255,255,255,.01)_58%,transparent_59%)]" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-8 px-6 pb-16 lg:grid-cols-2">
          <div className="relative z-10">
            <p className="text-xs font-bold tracking-[.3em] text-[#d2aa62]">THE SMALL-BUSINESS OPERATING SYSTEM</p>
            <h1 className="mt-7 max-w-xl font-serif text-5xl leading-[1.02] text-[#f3efe7] sm:text-6xl">Wedge-Works.com, the tools behind every business.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">Bring your people, processes, customer presence and executive intelligence together—without enterprise complexity.</p>
            <div className="mt-9 flex flex-wrap gap-3"><a href="/wedgeweb" className="rounded-md bg-[#d2aa62] px-7 py-4 font-bold text-[#0d1316] shadow-[0_15px_40px_rgba(210,170,98,.18)]">Start Free</a><a href="#platform" className="rounded-md border border-[#5e8983]/70 px-7 py-4 font-semibold text-[#b9d7d2]">Explore Platform</a></div>
            <p className="mt-4 text-xs text-white/35">No credit card required for WedgeWeb preview.</p>
          </div>
          <div className="lg:translate-x-16 xl:translate-x-24"><RotatingLaptop /></div>
        </div>
      </section>

      <section id="platform" className="bg-[#f3efe7] px-6 py-24 text-[#20282c]">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold tracking-[.28em] text-[#5e8983]">ONE WEDGE WORKS ECOSYSTEM</p><h2 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">Built for the way small businesses <em className="font-normal text-[#5e8983]">really</em> work.</h2><p className="mt-5 leading-7 text-[#526065]">Begin with the tool you need today. Add the others as your business grows.</p></div>
          <div className="mt-16 grid gap-0 border-y border-[#20282c]/10 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product, index) => <article key={product.name} className="border-[#20282c]/10 px-7 py-10 md:border-l md:first:border-l-0 xl:[&:nth-child(3n+1)]:border-l-0"><div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d2aa62]/45 text-[#5e8983]">{index === 0 ? "◎" : index === 1 ? "✦" : index === 2 ? "◇" : index === 3 ? "⌂" : "▣"}</div><p className="mt-7 text-[10px] font-bold tracking-[.22em] text-[#b08745]">{product.eyebrow}</p><h3 className="mt-3 font-serif text-3xl">{product.name}</h3><p className="mt-4 min-h-[84px] text-sm leading-7 text-[#59666a]">{product.text}</p><a href={product.href} className="mt-6 inline-flex border-b border-[#5e8983]/40 pb-1 text-sm font-bold text-[#497973]">{product.action} →</a></article>)}
          </div>
        </div>
      </section>

      <section id="industries">
        <article className="relative min-h-[620px] overflow-hidden bg-[#0a1115] text-[#f3efe7]">
          <div className="absolute inset-0 grid grid-cols-2">
            <div className="relative overflow-hidden">
              <img
                src="/landing/smart-agriculture.png"
                alt="technology-assisted production operation"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#081015]/10 via-transparent to-[#081015]/55" />
            </div>
            <div className="relative overflow-hidden">
              <img
                src="/landing/wedge-supply-operations.png"
                alt="central kitchen and warehouse operation"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-[#081015]/10 via-transparent to-[#081015]/55" />
            </div>
          </div>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,13,.18),rgba(5,10,13,.1)_45%,rgba(5,10,13,.35))]" />
          <div className="relative mx-auto flex min-h-[620px] max-w-[1500px] items-center justify-center px-5 py-16">
            <div className="w-full max-w-xl rounded-[30px] border border-white/18 bg-[#0b1317]/88 p-7 text-center shadow-[0_35px_100px_rgba(0,0,0,.45)] backdrop-blur-md sm:p-10">
              <p className="text-xs font-bold tracking-[.25em] text-[#d2aa62]">
                WEDGE-SUPPLY ERP · CENTRAL OPERATIONS
              </p>
              <h2 className="mt-5 font-serif text-4xl leading-[1.08] sm:text-5xl">
                Purchase centrally. Produce efficiently. Distribute with control.
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-base leading-8 text-white/65">
                Connect outlet requests, suppliers, receiving, production,
                warehouse stock and deliveries in one practical system.
              </p>
              <a
                href="/wedge-supply"
                className="mt-8 inline-flex rounded-full bg-[#d2aa62] px-8 py-4 font-black text-[#0a1115] shadow-[0_18px_45px_rgba(210,170,98,.25)]"
              >
                Open Wedge-Supply ERP
              </a>
            </div>
          </div>
        </article>
        {stories.map((story) => <article id={story.eyebrow === "WEDGE-SMARTPOS" ? "smartpos" : undefined} key={story.eyebrow} className={story.dark ? "bg-[#102029] text-[#f3efe7]" : "bg-[#f3efe7] text-[#20282c]"}><div className="mx-auto grid min-h-[520px] max-w-[1500px] lg:grid-cols-2"><div className={`${story.imageFirst ? "lg:order-2" : ""} flex items-center px-8 py-16 sm:px-14 lg:px-20`}><div className="max-w-lg"><p className={`text-xs font-bold tracking-[.24em] ${story.dark ? "text-[#d2aa62]" : "text-[#b08745]"}`}>{story.eyebrow}</p><h2 className="mt-6 font-serif text-4xl leading-[1.08] sm:text-5xl">{story.title}</h2><div className="mt-7 h-0.5 w-12 bg-[#d2aa62]" /><p className={`mt-7 text-base leading-8 ${story.dark ? "text-white/60" : "text-[#59666a]"}`}>{story.text}</p>{"secondImage" in story && <div className="mt-7 flex flex-wrap gap-2 text-xs text-[#59666a]"><span className="rounded-full border border-[#20282c]/10 bg-white/50 px-3 py-2">Appointments</span><span className="rounded-full border border-[#20282c]/10 bg-white/50 px-3 py-2">Client profiles</span><span className="rounded-full border border-[#20282c]/10 bg-white/50 px-3 py-2">POS & payments</span></div>}<a href={story.href} className={`mt-9 inline-flex rounded-md px-6 py-3 font-bold ${story.dark ? "bg-[#d2aa62] text-[#0d1316]" : "bg-[#20282c] text-[#f3efe7]"}`}>{story.action}</a></div></div>{"secondImage" in story && story.secondImage ? <div className="relative min-h-[500px] overflow-hidden bg-[#ded4c7] p-6 sm:p-10"><div className="grid h-full min-h-[420px] grid-cols-[1.15fr_.85fr] gap-4"><div className="overflow-hidden rounded-[28px] shadow-[0_25px_60px_rgba(32,40,44,.18)]"><img src={story.secondImage} alt="premium salon and spa treatment environment" className="h-full w-full object-cover" /></div><div className="my-10 overflow-hidden rounded-[24px] border-4 border-[#f3efe7] shadow-[0_25px_55px_rgba(32,40,44,.2)]"><img src={story.image} alt="pet grooming and spa service" className="h-full w-full object-cover" /></div></div><div className="absolute bottom-8 left-1/2 w-[min(330px,76%)] -translate-x-1/2 rounded-2xl border border-white/70 bg-[#f8f5ef]/95 p-4 shadow-2xl backdrop-blur"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold tracking-[.18em] text-[#b08745]">TODAY</p><p className="mt-1 font-bold text-[#20282c]">Appointments at a glance</p></div><span className="rounded-full bg-[#5e8983]/15 px-3 py-1 text-xs font-bold text-[#497973]">8 booked</span></div><div className="mt-3 flex gap-2"><span className="h-2 flex-[1.4] rounded-full bg-[#d2aa62]" /><span className="h-2 flex-1 rounded-full bg-[#5e8983]" /><span className="h-2 flex-[.6] rounded-full bg-[#d8cdc0]" /></div></div></div> : <div className={`${story.imageFirst ? "lg:order-1" : ""} min-h-[380px] overflow-hidden`}><img src={story.image} alt={story.eyebrow.toLowerCase()} className="h-full w-full object-cover transition duration-700 hover:scale-[1.025]" /></div>}</div></article>)}
      </section>

      <section className="relative bg-[#0d1316] px-6 py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(94,137,131,.12),transparent_30%),radial-gradient(circle_at_20%_40%,rgba(210,170,98,.1),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[.85fr_1.15fr]"><div><p className="text-xs font-bold tracking-[.28em] text-[#d2aa62]">EVERYDAY IMPACT</p><h2 className="mt-6 font-serif text-5xl leading-tight">One platform.<br />Endless possibilities.</h2><p className="mt-6 max-w-lg leading-8 text-white/60">Clock in securely, understand the business, build customer relationships and connect appointments, purchasing and stock with daily operations.</p><div className="mt-9 flex flex-wrap gap-3"><a href="/wedgeweb" className="rounded-md bg-[#d2aa62] px-7 py-4 font-bold text-[#0d1316]">Start Free</a><a href="/manager-login" className="rounded-md border border-[#5e8983]/60 px-7 py-4 font-semibold text-[#b9d7d2]">Open Manager Desk</a></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/[.035] p-7"><p className="text-sm text-white/40">WedgeCLOCKin</p><p className="mt-3 text-2xl font-bold text-[#f1dfbc]">People and attendance</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-7"><p className="text-sm text-white/40">Wedge-I</p><p className="mt-3 text-2xl font-bold text-[#f1dfbc]">Executive clarity</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-7"><p className="text-sm text-white/40">WedgeWeb</p><p className="mt-3 text-2xl font-bold text-[#f1dfbc]">Customer presence and CRM</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-7"><p className="text-sm text-white/40">Wedge-SmartPOS</p><p className="mt-3 text-2xl font-bold text-[#f1dfbc]">Clients and appointments</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-7 sm:col-span-2"><p className="text-sm text-white/40">Wedge-Supply ERP</p><p className="mt-3 text-2xl font-bold text-[#f1dfbc]">Purchasing, production and distribution</p></div></div></div>
      </section>

      <footer className="border-t border-white/8 bg-[#080c0f] px-6 py-8 text-sm text-white/40"><div className="mx-auto flex max-w-7xl flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><p>© {new Date().getFullYear()} Wedge Works. All rights reserved.</p><div className="flex flex-wrap gap-3"><a href="/privacy" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-[#d2aa62]/50 hover:text-[#f1dfbc]">Privacy Policy</a><a href="/terms" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-[#d2aa62]/50 hover:text-[#f1dfbc]">Terms of Use</a><a href="/disclaimer" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-[#d2aa62]/50 hover:text-[#f1dfbc]">Disclaimer</a><a href="/manager-login" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-[#d2aa62]/50 hover:text-[#f1dfbc]">Manager Login</a></div></div></footer>
    </main>
  );
}
