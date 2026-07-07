import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans antialiased selection:bg-white/10 selection:text-white">
      
      {/* 1. HERO & WedgeCLOCKin SECTION */}
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 max-w-5xl mx-auto text-center border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        
        <span className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-4 block animate-fade-in">
          Wedge Works Ecosystem
        </span>
        <h1 className="text-5xl md:text-7xl font-light tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-500 mb-6">
          WedgeCLOCKin
        </h1>
        <p className="text-zinc-400 max-w-xl text-base md:text-lg font-light leading-relaxed mb-12">
          Next-generation workforce management. Complete with AWS Rekognition face verification, GPS attendance tracking, and isolated company architectures.
        </p>

        {/* Updated Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
          <a
            href="#download-beta"
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-medium text-sm rounded-full tracking-wide hover:bg-zinc-200 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            Download Android Beta
          </a>
          <Link
            href="/manager-login"
            className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900/80 text-zinc-300 font-medium text-sm rounded-full tracking-wide border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all duration-300 backdrop-blur-md"
          >
            WedgeCLOCKin Manager Login
          </Link>
        </div>
      </section>

      {/* 2. WEDGE-I SHOWCASE SECTION */}
      <section className="py-32 px-4 max-w-5xl mx-auto text-center border-b border-white/5">
        <div className="max-w-2xl mx-auto">
          <span className="text-xs uppercase tracking-[0.3em] text-amber-500/80 mb-4 block">
            Coming Soon
          </span>
          <h2 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-6">
            Meet Wedge-i
          </h2>
          <p className="text-zinc-400 text-base md:text-lg font-light leading-relaxed mb-10">
            The intelligent layer for business metrics. Transform raw operational data into predictive forecasting, AI executive summaries, and instant cashflow health scoring.
          </p>
          
          <Link
            href="/wedge-i"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-zinc-900 to-black text-zinc-400 hover:text-white font-medium text-sm rounded-full tracking-wide border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300"
          >
            Explore Wedge-i
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* 3. FUTURE PRODUCTS PLACEHOLDER */}
      <section className="py-24 px-4 max-w-5xl mx-auto text-center opacity-40">
        <p className="text-xs uppercase tracking-[0.4em] text-zinc-600">
          Future Ecosystem Modules
        </p>
      </section>
      
    </div>
  );
}