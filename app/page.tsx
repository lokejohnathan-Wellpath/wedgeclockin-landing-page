import RotatingLaptop from "./components/RotatingLaptop";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedge Works | Operate, Decide and Grow",
  description:
    "WedgeCLOCKin, Wedge-I and WedgeWeb bring workforce operations, executive intelligence and a customer-ready web presence into one practical platform.",
};

const apkUrl = "https://github.com/lokejohnathan-Wellpath/WedgeCLOCKin/releases/download/v1.0.0-beta/Wedge-worksbeta1.01.apk";

const products = [
  { name: "WedgeCLOCKin", eyebrow: "WORKFORCE", text: "Face and GPS attendance, leave, payroll-ready records and secure employee operations.", href: "/employee-clockin", action: "Explore ClockIn" },
  { name: "Wedge-I", eyebrow: "EXECUTIVE AI", text: "Turn operating numbers into forecasts, priorities and clearer management decisions.", href: "/wedge-i", action: "Open Wedge-I" },
  { name: "WedgeWeb", eyebrow: "WEBSITE ENGINE", text: "Create a professional customer website through a guided conversation and publish when ready.", href: "/wedgeweb", action: "Create Free Preview" },
];

const stories = [
  { eyebrow: "SMART AGRICULTURE", title: "Grow more. Waste less. Decide better.", text: "Bring people, daily activity and performance information into one clearer operating rhythm.", image: "/landing/smart-agriculture.png", dark: true, imageFirst: false },
  { eyebrow: "PRECISION MANUFACTURING", title: "Produce with precision. Deliver with confidence.", text: "Strengthen workforce visibility, management discipline and decision-making across every shift.", image: "/landing/precision-manufacturing.png", dark: false, imageFirst: true },
  { eyebrow: "AI–HUMAN PARTNERSHIP", title: "AI that works with you, not instead of you.", text: "Automate the routine, surface what matters and keep human judgement at the centre of every decision.", image: "/landing/ai-partnership.png", dark: true, imageFirst: false },
  { eyebrow: "PET SERVICES", title: "Happier pets. Happier customers. Healthier business.", text: "Connect bookings, staff routines, customer communication and business oversight in one practical ecosystem.", image: "/landing/pet-services.png", dark: false, imageFirst: false },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#0d1316] text-[#f3efe7]">
      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <a href="#top" className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d2aa62] font-black text-[#0d1316]">W</span><div><p className="font-semibold text-[#f1dfbc]">Wedge Works</p><p className="text-[10px] tracking-[.14em] text-white/40">OPERATE · DECIDE · GROW</p></div></a>
          <nav className="hidden items-center gap-7 text-sm text-white/60 lg:flex"><a href="#platform" className="hover:text-white">Platform</a><a href="#industries" className="hover:text-white">Possibilities</a><a href="/wedgeweb" className="hover:text-white">WedgeWeb</a><a href="/manager-login" className="rounded-full border border-white/15 px-5 py-2.5 text-white">Manager Login</a></nav>
        </div>
      </header>

      <section id="top" className="relative min-h-[820px] border-b border-white/8 bg-[#080c0f] pt-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_25%,rgba(94,137,131,.2),transparent_30%),radial-gradient(circle_at_20%_45%,rgba(210,170,98,.11),transparent_35%),linear-gradient(125deg,#080c0f,#111a20_58%,#080c0f)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(168deg,transparent_48%,rgba(255,255,255,.04)_49%,rgba(255,255,255,.01)_58%,transparent_59%)]" />
        <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-8 px-6 pb-16 lg:grid-cols-[.88fr_1.12fr]">
          <div className="relative z-10">
            <p className="text-xs font-bold tracking-[.3em] text-[#d2aa62]">THE SMALL-BUSINESS OPERATING SYSTEM</p>
            <h1 className="mt-7 max-w-2xl font-serif text-5xl leading-[1.02] text-[#f3efe7] sm:text-6xl lg:text-7xl">One platform for everyday operations and smarter decisions.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/65">Bring your people, processes, customer presence and executive intelligence together—without enterprise complexity.</p>
            <div className="mt-9 flex flex-wrap gap-3"><a href="/wedgeweb" className="rounded-md bg-[#d2aa62] px-7 py-4 font-bold text-[#0d1316] shadow-[0_15px_40px_rgba(210,170,98,.18)]">Start Free</a><a href="#platform" className="rounded-md border border-[#5e8983]/70 px-7 py-4 font-semibold text-[#b9d7d2]">Explore Platform</a></div>
            <p className="mt-4 text-xs text-white/35">No credit card required for WedgeWeb preview.</p>
          </div>
          <RotatingLaptop />
        </div>
      </section>

      <section id="platform" className="bg-[#f3efe7] px-6 py-24 text-[#20282c]">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold tracking-[.28em] text-[#5e8983]">ONE WEDGE WORKS ECOSYSTEM</p><h2 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">Built for the way small businesses <em className="font-normal text-[#5e8983]">really</em> work.</h2><p className="mt-5 leading-7 text-[#526065]">Begin with the tool you need today. Add the others as your business grows.</p></div>
          <div className="mt-16 grid gap-0 border-y border-[#20282c]/10 md:grid-cols-3">
            {products.map((product, index) => <article key={product.name} className={`px-7 py-10 ${index ? "border-t border-[#20282c]/10 md:border-l md:border-t-0" : ""}`}><div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d2aa62]/45 text-[#5e8983]">{index === 0 ? "◎" : index === 1 ? "✦" : "◇"}</div><p className="mt-7 text-[10px] font-bold tracking-[.22em] text-[#b08745]">{product.eyebrow}</p><h3 className="mt-3 font-serif text-3xl">{product.name}</h3><p className="mt-4 min-h-[84px] text-sm leading-7 text-[#59666a]">{product.text}</p><a href={product.href} className="mt-6 inline-flex border-b border-[#5e8983]/40 pb-1 text-sm font-bold text-[#497973]">{product.action} →</a></article>)}
          </div>
        </div>
      </section>

      <section id="industries">
        {stories.map((story) => <article key={story.eyebrow} className={story.dark ? "bg-[#102029] text-[#f3efe7]" : "bg-[#f3efe7] text-[#20282c]"}><div className="mx-auto grid min-h-[520px] max-w-[1500px] lg:grid-cols-2"><div className={`${story.imageFirst ? "lg:order-2" : ""} flex items-center px-8 py-16 sm:px-14 lg:px-20`}><div className="max-w-lg"><p className={`text-xs font-bold tracking-[.24em] ${story.dark ? "text-[#d2aa62]" : "text-[#b08745]"}`}>{story.eyebrow}</p><h2 className="mt-6 font-serif text-4xl leading-[1.08] sm:text-5xl">{story.title}</h2><div className="mt-7 h-0.5 w-12 bg-[#d2aa62]" /><p className={`mt-7 text-base leading-8 ${story.dark ? "text-white/60" : "text-[#59666a]"}`}>{story.text}</p><div className={`mt-8 rounded-xl border p-5 text-sm leading-6 ${story.dark ? "border-white/10 bg-white/[.035] text-white/55" : "border-[#20282c]/10 bg-white/35 text-[#59666a]"}`}>Wedge Works adapts to different sectors while keeping the same goal: clearer operations and more confident decisions.</div></div></div><div className={`${story.imageFirst ? "lg:order-1" : ""} min-h-[380px] overflow-hidden`}><img src={story.image} alt={story.eyebrow.toLowerCase()} className="h-full w-full object-cover transition duration-700 hover:scale-[1.025]" /></div></div></article>)}
      </section>

      <section className="relative bg-[#0d1316] px-6 py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(94,137,131,.12),transparent_30%),radial-gradient(circle_at_20%_40%,rgba(210,170,98,.1),transparent_28%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[.85fr_1.15fr]"><div><p className="text-xs font-bold tracking-[.28em] text-[#d2aa62]">EVERYDAY IMPACT</p><h2 className="mt-6 font-serif text-5xl leading-tight">One platform.<br />Endless possibilities.</h2><p className="mt-6 max-w-lg leading-8 text-white/60">Clock in securely, understand the business, build a customer-ready website and grow into a connected operating system.</p><div className="mt-9 flex flex-wrap gap-3"><a href="/wedgeweb" className="rounded-md bg-[#d2aa62] px-7 py-4 font-bold text-[#0d1316]">Start Free</a><a href="/manager-login" className="rounded-md border border-[#5e8983]/60 px-7 py-4 font-semibold text-[#b9d7d2]">Open Manager Desk</a></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-white/[.035] p-7"><p className="text-sm text-white/40">WedgeCLOCKin</p><p className="mt-3 text-2xl font-bold text-[#f1dfbc]">People and attendance</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-7"><p className="text-sm text-white/40">Wedge-I</p><p className="mt-3 text-2xl font-bold text-[#f1dfbc]">Executive clarity</p></div><div className="rounded-2xl border border-white/10 bg-white/[.035] p-7 sm:col-span-2"><p className="text-sm text-white/40">WedgeWeb</p><p className="mt-3 text-2xl font-bold text-[#f1dfbc]">A customer-ready digital presence</p></div></div></div>
      </section>

      <footer className="border-t border-white/8 bg-[#080c0f] px-6 py-8 text-sm text-white/40"><div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Wedge Works. All rights reserved.</p><div className="flex gap-5"><a href="/privacy">Privacy</a><a href="/manager-login">Manager Login</a><a href={apkUrl}>Android Beta</a></div></div></footer>
    </main>
  );
}
