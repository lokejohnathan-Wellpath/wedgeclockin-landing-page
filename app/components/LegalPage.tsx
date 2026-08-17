import Link from "next/link";
import type { ReactNode } from "react";

const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export default function LegalPage({
  eyebrow = "WEDGE WORKS",
  title,
  effectiveDate,
  introduction,
  children,
}: {
  eyebrow?: string;
  title: string;
  effectiveDate: string;
  introduction: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#0b1013] px-5 py-8 text-[#f3efe7] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d2aa62] font-black text-[#0d1316]">
              W
            </span>
            <span>
              <span className="block font-semibold text-[#f1dfbc]">Wedge Works</span>
              <span className="block text-[10px] tracking-[.14em] text-white/40">
                OPERATE · DECIDE · GROW
              </span>
            </span>
          </Link>
          <Link
            href="/manager-login"
            className="w-fit rounded-full border border-white/15 px-5 py-2.5 text-sm text-white transition hover:border-[#d2aa62]/60 hover:text-[#f1dfbc]"
          >
            Manager Login
          </Link>
        </header>

        <article className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-[#151c20] shadow-[0_35px_100px_rgba(0,0,0,.3)]">
          <div className="border-b border-white/10 bg-[radial-gradient(circle_at_82%_15%,rgba(94,137,131,.22),transparent_35%),linear-gradient(135deg,#151c20,#10171a)] px-7 py-10 sm:px-12 sm:py-14">
            <p className="text-xs font-bold tracking-[.28em] text-[#d2aa62]">{eyebrow}</p>
            <h1 className="mt-5 font-serif text-4xl leading-tight text-[#f3efe7] sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-white/65">{introduction}</p>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[.16em] text-white/35">
              Effective date: {effectiveDate}
            </p>
          </div>

          <div className="px-7 py-4 sm:px-12">{children}</div>

          <footer className="border-t border-white/10 px-7 py-8 sm:px-12">
            <div className="flex flex-wrap gap-3">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/55 transition hover:border-[#d2aa62]/50 hover:text-[#f1dfbc]"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/"
                className="rounded-full border border-[#d2aa62]/35 px-4 py-2 text-sm text-[#f1dfbc] transition hover:bg-[#d2aa62] hover:text-[#0d1316]"
              >
                Return to Wedge Works
              </Link>
            </div>
            <p className="mt-6 text-xs leading-6 text-white/30">
              © {new Date().getFullYear()} Wedge Works. All rights reserved.
            </p>
          </footer>
        </article>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-white/8 py-8 last:border-b-0 sm:py-10">
      <h2 className="font-serif text-2xl text-[#f1dfbc]">{title}</h2>
      <div className="mt-4 space-y-4 text-sm leading-7 text-white/65 [&_a]:text-[#d2aa62] [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_ol]:space-y-2 [&_p]:max-w-4xl [&_ul]:space-y-2">
        {children}
      </div>
    </section>
  );
}
