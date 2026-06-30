const apkUrl =
  "https://github.com/lokejohnathan-Wellpath/WedgeCLOCKin/releases/latest/download/Wedge-worksbeta1.01.apk";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-lg font-bold">🕒 WedgeCLOCKin</div>

        <nav className="hidden gap-8 text-sm text-white/60 md:flex">
          <a href="#features">Features</a>
          <a href="#industries">Industries</a>
          <a href="#why">Why us</a>
        </nav>

        <a
          href={apkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#d4ad63] px-5 py-2 text-sm font-semibold text-black"
        >
          Download Beta
        </a>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <div className="mb-8 inline-block rounded-full border border-white/10 px-4 py-2 text-sm text-white/60">
            • Now in Android Beta
          </div>

          <h1 className="text-6xl font-bold tracking-tight text-[#f0dfbd]">
            WedgeCLOCKin
          </h1>

          <p className="mt-6 text-3xl font-semibold leading-tight">
            Smart Workforce Attendance for Modern Businesses.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/60">
            {["Face Recognition", "GPS Attendance", "Leave Management", "Payroll Export"].map(
              (item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/10 px-4 py-2"
                >
                  {item}
                </span>
              )
            )}
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <a
              href={apkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#d4ad63] px-8 py-4 text-center font-semibold text-black"
            >
              Download Android Beta
            </a>

            <button
              type="button"
              className="rounded-full border border-white/10 px-8 py-4 font-semibold text-white/80"
            >
              Coming Soon for iPhone
            </button>
          </div>
        </div>

        <div className="mx-auto w-[300px] rounded-[3rem] border-8 border-[#252d31] bg-[#111417] p-6 shadow-2xl">
          <div className="text-center text-sm font-bold">WedgeCLOCKin</div>

          <div className="mt-8 rounded-3xl border border-[#d4ad63]/30 bg-[#2b241b] p-5">
            <div className="text-xl font-bold">Face verified</div>
            <div className="text-sm text-white/50">KL HQ · within zone</div>
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
            {["Employee 1", "Employee 2", "Employee 3", "Employee 4"].map(
              (name, i) => (
                <div key={name} className="flex justify-between py-2 text-sm">
                  <span>{name}</span>
                  <span className="text-[#d4ad63]">
                    {i === 2 ? "Leave" : `09:0${i}`}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-center text-sm tracking-[0.4em] text-[#d4ad63]">
          EVERYTHING YOU NEED
        </p>

        <h2 className="mx-auto mt-6 max-w-2xl text-center text-5xl font-bold">
          One app for your entire attendance workflow
        </h2>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            ["Face Recognition Clock In", "Employees clock in with a glance."],
            ["GPS Verification", "Confirm every check-in happens on-site."],
            ["Leave Management", "Approve and track leave requests easily."],
            ["Payroll Export", "Turn attendance into payroll-ready exports."],
            ["Employee Dashboard", "Give staff a clear view of hours and leave."],
            ["Secure Cloud Sync", "Keep records safe and available everywhere."],
          ].map(([title, text]) => (
            <div
              key={title}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-8"
            >
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