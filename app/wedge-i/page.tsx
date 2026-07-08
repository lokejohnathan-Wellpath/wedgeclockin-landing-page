export default function WedgeIPage() {
  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6 py-20">
        <div className="w-full max-w-5xl rounded-[2rem] border border-[#d4ad63]/30 bg-[#1e2428] p-10">
          <p className="text-sm tracking-[0.3em] text-[#d4ad63]">WEDGE-I</p>

          <h1 className="mt-4 text-5xl font-bold text-[#f0dfbd]">
            AI Business Intelligence
          </h1>

          <p className="mt-6 max-w-3xl text-lg text-white/60">
            Welcome to Wedge-i. This is the future AI executive dashboard for Malaysian SMEs.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-6">
              <p className="text-white/50">Business Health</p>
              <p className="mt-2 text-4xl font-bold text-[#d4ad63]">87</p>
            </div>

            <div className="rounded-2xl bg-white/5 p-6">
              <p className="text-white/50">Revenue</p>
              <p className="mt-2 text-4xl font-bold">RM 48,200</p>
            </div>

            <div className="rounded-2xl bg-white/5 p-6">
              <p className="text-white/50">Profit Forecast</p>
              <p className="mt-2 text-4xl font-bold text-[#d4ad63]">+18%</p>
            </div>
          </div>

          <a
            href="/"
            className="mt-10 inline-block rounded-full border border-[#d4ad63]/40 px-8 py-4 font-semibold text-[#f0dfbd] hover:bg-white/5"
          >
            Back to WedgeCLOCKin
          </a>
        </div>
      </section>
    </main>
  );
}
