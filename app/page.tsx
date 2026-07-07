const apkUrl = "https://github.com/lokejohnathan-Wellpath/WedgeCLOCKin/releases/download/v1.0.0-beta/Wedge-worksbeta1.01.apk";
const pills = ["Face Recognition", "GPS Attendance", "Leave Management", "Payroll Export"];
const features = [
  ["Face Recognition Clock In", "Employees clock in with a glance. Fast, contactless, and harder to fake."],
  ["GPS Verification", "Confirm every check-in happens on-site with location verification."],
  ["Leave Management", "Approve, track, and balance leave requests in seconds."],
  ["Payroll Export", "Turn attendance records into payroll-ready exports."],
  ["Employee Dashboard", "Give staff a clear view of hours, shifts, and leave."],
  ["Secure Cloud Sync", "Keep attendance records safe and available everywhere."],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3 text-lg font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4ad63] text-black">
            ◷
          </span>
          Wedge Works
        </div>
        <nav className="hidden gap-8 text-sm text-white/60 md:flex">
          <a href="#features" className="hover:text-white">WedgeCLOCKin</a>
          <a href="#wedge-i" className="hover:text-white">Wedge-i</a>
          <a href="#why" className="hover:text-white">Why us</a>
        </nav>
        <a href="/manager-login" className="rounded-full bg-[#d4ad63] px-5 py-2 text-sm font-semibold text-black hover:bg-[#e4bf75]">
          Manager PC Login
        </a>
      </header>

      {/* Hero Section */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <div className="mb-8 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
            <span className="text-[#d4ad63]">•</span> WedgeCLOCKin now in Android Beta
          </div>
          <h1 className="text-6xl font-bold tracking-tight text-[#f0dfbd] md:text-7xl">
            Wedge Works
          </h1>
          <p className="mt-6 max-w-xl text-3xl font-semibold leading-tight">
            Smart workforce and AI business tools for modern SMEs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/60">
            {pills.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                {item}
              </span>
            ))}
          </div>
          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <a href={apkUrl} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#d4ad63] px-8 py-4 text-center font-semibold text-black hover:bg-[#e4bf75]">
              Download Android Beta
            </a>
            <a href="#wedge-i" className="rounded-full border border-[#d4ad63]/50 px-8 py-4 text-center font-semibold text-[#f0dfbd] hover:bg-white/5">
              Explore Wedge-i
            </a>
          </div>
        </div>

        {/* WedgeCLOCKin UI Preview */}
        <div className="mx-auto w-[320px] rounded-[3rem] border-[14px] border-[#252d31] bg-[#111417] p-6 shadow-2xl">
          <div className="mb-8 text-center text-sm font-bold">WedgeCLOCKin</div>
          <div className="rounded-3xl border border-[#d4ad63]/30 bg-[#2b241b] p-6">
            <div className="text-2xl font-bold">Face verified</div>
            <div className="mt-1 text-sm text-white/50">KL HQ · within zone</div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/5 p-5">
              <div className="text-xs text-white/40">CLOCKED IN</div>
              <div className="text-3xl font-bold">18</div>
            </div>
            <div className="rounded-2xl bg-white/5 p-5">
              <div className="text-xs text-white/40">ON LEAVE</div>
              <div className="text-3xl font-bold text-[#d4ad63]">3</div>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-white/5 p-5">
            <div className="mb-4 font-bold">Today&apos;s shift</div>
            {["Employee 1", "Employee 2", "Employee 3", "Employee 4"].map((name, i) => (
              <div key={name} className="flex justify-between py-2 text-sm">
                <span>{name}</span>
                <span className="text-[#d4ad63]">
                  {i === 2 ? "Leave" : i === 0 ? "08:58" : i === 1 ? "09:02" : "09:11"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upgraded Premium Wedge-i Section */}
      <section id="wedge-i" className="border-t border-white/5 bg-[#0b0d0e] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Copy Column */}
            <div className="lg:col-span-5">
              <p className="text-sm font-bold tracking-[0.3em] text-[#d4ad63] uppercase">
                Meet Wedge-i
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-[#f0dfbd] sm:text-5xl">
                AI Business Intelligence for SMEs.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-[#f4efe6]/70">
                Know your business before month-end. Wedge-i turns weekly sales, payroll, purchases, inventory, and expenses into a clear business health score and practical owner recommendations.
              </p>
              <div className="mt-10">
                <a href="/wedge-i" className="inline-block rounded-full bg-[#d4ad63] px-8 py-4 font-semibold text-black transition-colors hover:bg-[#e4bf75]">
                  Launch Wedge-i
                </a>
                <p className="mt-3 text-xs text-white/40">
                  Beta access coming soon for WedgeCLOCKin users.
                </p>
              </div>
            </div>

            {/* Right Bloomberg/Apple Style Dashboard Terminal Column */}
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#121619] shadow-2xl font-mono text-sm">
                {/* Terminal Header */}
                <div className="flex items-center justify-between border-b border-white/5 bg-[#161b1e] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500/40" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500/40" />
                    <span className="h-3 w-3 rounded-full bg-green-500/40" />
                    <span className="ml-2 text-xs font-semibold text-white/40 tracking-wider">WEDGE-I // INTELLIGENCE_CORE</span>
                  </div>
                  <span className="text-xs text-[#d4ad63]/70">LIVE OVERVIEW</span>
                </div>

                {/* Dashboard Grid */}
                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {/* Health Card */}
                    <div className="rounded-xl border border-[#d4ad63]/20 bg-[#1a1712] p-5">
                      <div className="text-xs tracking-wider text-white/40">BUSINESS HEALTH</div>
                      <div className="mt-2 text-3xl font-bold text-[#d4ad63]">92<span className="text-sm font-normal text-white/30">/100</span></div>
                      <div className="mt-1 text-xs text-green-400 font-sans">● Optimal Condition</div>
                    </div>

                    {/* Revenue Card */}
                    <div className="rounded-xl border border-white/5 bg-white/5 p-5">
                      <div className="text-xs tracking-wider text-white/40">REVENUE</div>
                      <div className="mt-2 text-2xl font-bold text-white">RM 126,430</div>
                      <div className="mt-1 text-xs text-green-400 font-sans">▲ +12% vs last week</div>
                    </div>

                    {/* Profit Forecast */}
                    <div className="rounded-xl border border-white/5 bg-white/5 p-5">
                      <div className="text-xs tracking-wider text-white/40">PROFIT FORECAST</div>
                      <div className="mt-2 text-2xl font-bold text-[#f0dfbd]">RM 38,200</div>
                      <div className="mt-1 text-xs text-white/40 font-sans">Expected month-end</div>
                    </div>
                  </div>

                  {/* Secondary Metrics Row */}
                  <div className="mt-4 grid gap-4 sm:grid-cols-3 border-t border-white/5 pt-4">
                    <div>
                      <div className="text-xs text-white/40">CASHFLOW STATUS</div>
                      <div className="mt-1 font-sans font-semibold text-green-400">Healthy</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">LABOUR COST %</div>
                      <div className="mt-1 text-white">18.4%</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/40">INVENTORY RISK</div>
                      <div className="mt-1 font-sans font-semibold text-yellow-500">Moderate</div>
                    </div>
                  </div>

                  {/* Bloomberg Style Insight Terminal Box */}
                  <div className="mt-6 rounded-xl border border-white/10 bg-[#161b1e] p-5">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#d4ad63]">
                      <span>✦</span> AI INSIGHT EXECUTIVE SUMMARY
                    </div>
                    <p className="mt-3 font-sans text-sm leading-relaxed text-[#f4efe6]/80">
                      Labour remains healthy, but purchasing cost increased this week. Reduce slow-moving inventory before the next stock order.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-center text-sm tracking-[0.4em] text-[#d4ad63]">WEDGECLOCKIN</p>
        <h2 className="mx-auto mt-6 max-w-2xl text-center text-5xl font-bold">
          One app for your entire attendance workflow
        </h2>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map(([title, text]) => (
            <div key={title} className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
              <div className="mb-8 h-12 w-12 rounded-full bg-[#d4ad63]/20" />
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="mt-4 text-white/55">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}