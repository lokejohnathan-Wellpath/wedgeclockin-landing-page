const apkUrl =
  "https://github.com/lokejohnathan-Wellpath/WedgeCLOCKin/releases/download/v1.0.0-beta/Wedge-worksbeta1.01.apk";

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
          WedgeCLOCKin
        </div>

        <nav className="hidden gap-8 text-sm text-white/60 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#manager-pc" className="hover:text-white">Manager PC</a>
          <a href="#why" className="hover:text-white">Why us</a>
        </nav>

        <a
          href={apkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#d4ad63] px-5 py-2 text-sm font-semibold text-black hover:bg-[#e4bf75]"
        >
          Download Beta
        </a>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <div className="mb-8 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
            <span className="text-[#d4ad63]">•</span> Now in Android Beta
          </div>

          <h1 className="text-6xl font-bold tracking-tight text-[#f0dfbd] md:text-7xl">
            WedgeCLOCKin
          </h1>

          <p className="mt-6 max-w-xl text-3xl font-semibold leading-tight">
            Smart Workforce Attendance for Modern Businesses.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/60">
            {pills.map((item) => (
              <span key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                {item}
              </span>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row">
            <a
              href={apkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-[#d4ad63] px-8 py-4 text-center font-semibold text-black hover:bg-[#e4bf75]"
            >
              Download Android Beta
            </a>

            <a
              href="/manager-login"
              className="rounded-full border border-[#d4ad63]/50 px-8 py-4 text-center font-semibold text-[#f0dfbd] hover:bg-white/5"
            >
              Manager PC Login
            </a>
          </div>
        </div>

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

      <section id="manager-pc" className="mx-auto max-w-6xl px-6 pb-10">
        <div className="rounded-[2rem] border border-[#d4ad63]/30 bg-[#1e2428] p-8 md:flex md:items-center md:justify-between">
          <div>
            <p className="text-sm tracking-[0.3em] text-[#d4ad63]">FOR MANAGERS</p>
            <h2 className="mt-3 text-3xl font-bold text-[#f0dfbd]">
              Payroll and CSV export on PC
            </h2>
            <p className="mt-3 max-w-2xl text-white/55">
              Use the mobile app for clock-in. Use the PC dashboard for salary entry,
              payroll review, and export-ready records.
            </p>
          </div>

          <a
            href="/manager-login"
            className="mt-6 inline-block rounded-full bg-[#d4ad63] px-8 py-4 text-center font-semibold text-black hover:bg-[#e4bf75] md:mt-0"
          >
            Manager PC Login
          </a>
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
          {features.map(([title, text]) => (
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