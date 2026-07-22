import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedge-SmartPOS | Choose your business",
  description: "Smart appointments, customer intelligence and POS operations for beauty, wellness and pet care businesses.",
};

const verticals = [
  {
    href: "/wedge-smartpos/beauty",
    eyebrow: "BEAUTY & WELLNESS",
    title: "Salon, barber, spa or slimming centre",
    text: "Manage clients, therapists, chairs, rooms, services, packages, commissions and every appointment in one simple POS system.",
    image: "/landing/salon-spa.png",
    features: ["Client profiles", "Staff & resources", "Packages & retail"],
    accent: "#b88955",
  },
  {
    href: "/wedge-smartpos/pet",
    eyebrow: "PET CARE",
    title: "Pet shop, spa or grooming centre",
    text: "Keep owners and pets clearly connected while managing groomers, services, products and return visits in one POS system.",
    image: "/landing/pet-services.png",
    features: ["Owner & pet profiles", "Grooming calendar", "Products & services"],
    accent: "#5e8983",
  },
];

export default function SmartPosEntry() {
  return (
    <main className="min-h-screen bg-[#f3efe7] text-[#20282c]">
      <header className="border-b border-[#20282c]/10 bg-[#f8f5ef]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#20282c] font-black text-[#f1dfbc]">W</span>
            <div><p className="font-semibold">Wedge-SmartPOS</p><p className="text-[10px] tracking-[.16em] text-[#6d777b]">OPERATE · CONNECT · GROW</p></div>
          </a>
          <a href="/manager-login" className="rounded-full border border-[#20282c]/15 px-5 py-2.5 text-sm font-semibold">Sign in</a>
        </div>
      </header>

      <section className="relative overflow-hidden px-6 py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(210,170,98,.15),transparent_26%),radial-gradient(circle_at_85%_22%,rgba(94,137,131,.14),transparent_26%)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold tracking-[.3em] text-[#b08745]">WELCOME TO WEDGE-SMARTPOS</p>
            <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-6xl">Choose your type of business.</h1>
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#667175]">Select your business below to start your free Wedge-SmartPOS trial.</p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {verticals.map((vertical) => (
              <a key={vertical.href} href={vertical.href} className="group overflow-hidden rounded-[28px] border border-[#20282c]/10 bg-white/70 shadow-[0_20px_60px_rgba(32,40,44,.09)] transition hover:-translate-y-1 hover:shadow-[0_28px_75px_rgba(32,40,44,.15)]">
                <div className="h-60 overflow-hidden sm:h-72"><img src={vertical.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]" /></div>
                <div className="p-7 sm:p-9">
                  <p className="text-[11px] font-bold tracking-[.24em]" style={{ color: vertical.accent }}>{vertical.eyebrow}</p>
                  <h2 className="mt-3 max-w-lg font-serif text-3xl leading-tight sm:text-4xl">{vertical.title}</h2>
                  <p className="mt-4 leading-7 text-[#667175]">{vertical.text}</p>
                  <div className="mt-6 flex flex-wrap gap-2">{vertical.features.map((feature) => <span key={feature} className="rounded-full border border-[#20282c]/10 bg-[#f8f5ef] px-3 py-2 text-xs">{feature}</span>)}</div>
                  <span className="mt-7 inline-flex items-center gap-2 font-bold" style={{ color: vertical.accent }}>Click Here to Enter Your POS <span aria-hidden>→</span></span>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm"><a href="/wedge-smartpos/signup" className="rounded-full bg-[#20282c] px-6 py-3 font-bold text-white">Start Free Trial</a><a href="/wedge-smartpos/login" className="rounded-full border border-[#20282c]/15 bg-white px-6 py-3 font-bold">Merchant Login</a></div>
        </div>
      </section>
    </main>
  );
}
