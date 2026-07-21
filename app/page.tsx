const apkUrl =
  "https://github.com/lokejohnathan-Wellpath/WedgeCLOCKin/releases/download/v1.0.0-beta/Wedge-worksbeta1.01.apk";

const workforceFeatures = [
  {
    title: "Face Recognition Clock In",
    description:
      "Employees clock in securely with face verification. Fast, contactless and harder to misuse.",
  },
  {
    title: "GPS Attendance",
    description:
      "Confirm attendance location and give managers a clearer view of where each record was created.",
  },
  {
    title: "Leave Management",
    description:
      "Employees apply digitally while managers review, approve and track balances from one portal.",
  },
  {
    title: "Payroll-Ready Records",
    description:
      "Turn attendance, overtime and leave records into organised payroll-ready information.",
  },
  {
    title: "Manager Control Centre",
    description:
      "Manage employees, attendance, leave and company operations through the Manager PC portal.",
  },
  {
    title: "Secure Company Isolation",
    description:
      "Each company operates within its own protected workspace and employee records remain separated.",
  },
];

const wedgeICapabilities = [
  "Business Health",
  "Cashflow Analysis",
  "Quarterly Forecast",
  "Labour Intelligence",
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080c0f] text-[#f4efe6]">
      <ExecutiveBackground />

      <div className="relative z-10">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#ead09b]/20 bg-[#c8a467] text-lg font-bold text-[#101416] shadow-[0_10px_30px_rgba(200,164,103,0.18)]">
              ◷
            </span>

            <div>
              <p className="font-bold text-[#f1dfbc]">Wedge Works</p>
              <p className="text-xs text-white/35">
                Workforce Operations & Executive Intelligence
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm text-white/50 lg:flex">
            <a
              href="#wedgeclockin"
              className="transition duration-200 hover:text-[#f1dfbc]"
            >
              WedgeCLOCKin
            </a>

            <a
              href="#wedge-i"
              className="transition duration-200 hover:text-[#f1dfbc]"
            >
              Wedge-I
            </a>

            <a
              href="#features"
              className="transition duration-200 hover:text-[#f1dfbc]"
            >
              Features
            </a>
            <a href="/wedgeweb" className="transition duration-200 hover:text-[#f1dfbc]">WedgeWeb</a>
          </nav>
        </header>

        <section
          id="wedgeclockin"
          className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:py-24"
        >
          <div className="relative">
            <div className="pointer-events-none absolute -left-20 top-8 h-72 w-72 rounded-full bg-[#b98f4d]/8 blur-[110px]" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-md">
                <span className="text-[#c8a467]">●</span>
                Android Beta Available
              </div>

              <p className="mt-8 text-xs font-semibold tracking-[0.34em] text-[#c8a467]">
                WORKFORCE OPERATIONS
              </p>

              <h1 className="mt-5 max-w-3xl text-5xl font-semibold tracking-tight text-[#f1dfbc] drop-shadow-[0_12px_35px_rgba(200,164,103,0.08)] sm:text-6xl lg:text-7xl">
                WedgeCLOCKin
              </h1>

              <p className="mt-6 max-w-2xl text-2xl font-semibold leading-tight text-white/85 sm:text-3xl">
                Smart attendance and workforce control for modern Malaysian
                businesses.
              </p>

              <p className="mt-6 max-w-2xl text-base leading-7 text-white/48">
                Face attendance, GPS verification, leave management and
                payroll-ready records—connected to a secure Manager PC portal.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                {[
                  "Face Recognition",
                  "GPS Attendance",
                  "Leave Management",
                  "Payroll Records",
                ].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-sm text-white/48 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] backdrop-blur-sm"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-11 flex flex-col gap-4 sm:flex-row">
                <a
                  href={apkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#c8a467] px-8 py-4 text-center font-bold text-[#111416] shadow-[0_14px_38px_rgba(200,164,103,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#dfbd7c]"
                >
                  Download Android Beta
                </a>

                <a
                  href="/manager-login"
                  className="rounded-full border border-[#c8a467]/45 bg-black/10 px-8 py-4 text-center font-semibold text-[#f1dfbc] backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#c8a467]/10"
                >
                  Open Manager Portal
                </a>

                <a
                  href="/employee-clockin"
                  className="rounded-full border border-white/15 bg-white/[0.035] px-8 py-4 text-center font-semibold text-white/75 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#c8a467]/40 hover:text-[#f1dfbc]"
                >
                  Employee Clock In
                </a>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[430px]">
            <div className="pointer-events-none absolute -inset-16 rounded-full bg-[#c8a467]/10 blur-[90px]" />
            <div className="pointer-events-none absolute -right-20 top-12 h-60 w-60 rounded-full bg-[#45616a]/12 blur-[100px]" />

            <div className="relative mx-auto w-full max-w-[390px] rounded-[3rem] border-[12px] border-[#222b2f] bg-[#11171b]/95 p-6 shadow-[0_45px_120px_rgba(0,0,0,0.58),0_0_70px_rgba(200,164,103,0.05)] backdrop-blur-xl">
              <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#e0bd7c]/45 to-transparent" />

              <div className="flex items-center justify-between">
                <p className="font-bold text-[#f1dfbc]">WedgeCLOCKin</p>
                <span className="h-2.5 w-2.5 rounded-full bg-[#c8a467] shadow-[0_0_15px_rgba(200,164,103,0.7)]" />
              </div>

              <div className="mt-7 rounded-3xl border border-[#c8a467]/25 bg-[linear-gradient(145deg,rgba(54,44,31,0.96),rgba(32,29,24,0.96))] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  Attendance Status
                </p>

                <p className="mt-3 text-2xl font-bold text-[#f1dfbc]">
                  Face verified
                </p>

                <p className="mt-2 text-sm text-white/42">
                  KL Headquarters · Within approved zone
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                  <p className="text-xs text-white/30">CLOCKED IN</p>
                  <p className="mt-2 text-3xl font-bold">18</p>
                </div>

                <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                  <p className="text-xs text-white/30">ON LEAVE</p>
                  <p className="mt-2 text-3xl font-bold text-[#c8a467]">3</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                <p className="mb-4 font-semibold text-[#f1dfbc]">
                  Today&apos;s workforce
                </p>

                {[
                  ["Employee 1", "08:58"],
                  ["Employee 2", "09:02"],
                  ["Employee 3", "Leave"],
                  ["Employee 4", "09:11"],
                ].map(([name, status]) => (
                  <div
                    key={name}
                    className="flex items-center justify-between border-t border-white/6 py-3 text-sm first:border-0"
                  >
                    <span className="text-white/48">{name}</span>
                    <span className="font-medium text-[#c8a467]">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="wedge-i"
          className="relative mx-auto max-w-7xl px-6 py-12"
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b98f4d]/7 blur-[130px]" />

          <div className="relative overflow-hidden rounded-[34px] border border-[#c8a467]/22 bg-[#11171b]/82 shadow-[0_38px_110px_rgba(0,0,0,0.36)] backdrop-blur-xl">
            <div className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-[#dfbc78]/40 to-transparent" />

            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#c8a467]/8 blur-[90px]" />
            <div className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-[#3e5962]/10 blur-[100px]" />

            <div className="relative grid gap-10 p-8 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-12">
              <div>
                <p className="text-xs font-semibold tracking-[0.34em] text-[#c8a467]">
                  EXECUTIVE INTELLIGENCE
                </p>

                <h2 className="mt-5 text-4xl font-semibold text-[#f1dfbc] sm:text-5xl">
                  Wedge-I
                </h2>

                <p className="mt-5 max-w-2xl text-xl font-semibold leading-tight text-white/80">
                  Turn business numbers into structured executive decisions.
                </p>

                <p className="mt-5 max-w-2xl text-base leading-7 text-white/46">
                  Wedge-I analyses financial performance, cash strength, labour
                  efficiency and Malaysian business rhythm to produce forecasts,
                  recommendations, executive charts and the next management
                  meeting agenda.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {wedgeICapabilities.map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-white/48 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] backdrop-blur-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>

                <a
                  href="/wedge-i"
                  className="mt-9 inline-flex rounded-full bg-[#c8a467] px-8 py-4 font-bold text-[#111416] shadow-[0_14px_38px_rgba(200,164,103,0.16)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#dfbd7c]"
                >
                  Open Wedge-I Executive Desk
                </a>
              </div>

              <div className="rounded-[28px] border border-[#c8a467]/18 bg-[#090e11]/88 p-7 shadow-[0_25px_70px_rgba(0,0,0,0.26),inset_0_1px_0_rgba(255,255,255,0.025)] backdrop-blur-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/30">
                      Business Health
                    </p>

                    <p className="mt-3 text-5xl font-semibold text-[#c8a467] drop-shadow-[0_8px_30px_rgba(200,164,103,0.14)]">
                      87
                    </p>
                  </div>

                  <span className="rounded-full border border-[#c8a467]/20 bg-[#c8a467]/10 px-4 py-2 text-xs font-semibold text-[#d8b778]">
                    Strong
                  </span>
                </div>

                <div className="mt-7 space-y-4">
                  {[
                    ["Revenue Outlook", "Improving"],
                    ["Operating Margin", "Healthy"],
                    ["Labour Efficiency", "Within range"],
                    ["Cash Position", "Stable"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between border-t border-white/8 pt-4"
                    >
                      <span className="text-sm text-white/35">{label}</span>
                      <span className="text-sm font-semibold text-[#f1dfbc]">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-7 rounded-2xl border border-white/8 bg-white/[0.025] p-5">
                  <p className="text-xs font-semibold tracking-[0.15em] text-[#c8a467]">
                    EXECUTIVE VIEW
                  </p>

                  <p className="mt-3 text-sm leading-6 text-white/48">
                    Current performance supports controlled growth, provided
                    management maintains margin discipline, cash visibility and
                    labour productivity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="relative mx-auto max-w-7xl px-6 py-20"
        >
          <p className="text-center text-xs font-semibold tracking-[0.34em] text-[#c8a467]">
            WEDGECLOCKIN CAPABILITIES
          </p>

          <h2 className="mx-auto mt-5 max-w-3xl text-center text-4xl font-semibold text-[#f1dfbc] sm:text-5xl">
            One connected workforce workflow
          </h2>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {workforceFeatures.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-[26px] border border-white/9 bg-white/[0.025] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#c8a467]/20 hover:bg-white/[0.04] hover:shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
              >
                <div className="h-11 w-11 rounded-full border border-[#c8a467]/20 bg-[#c8a467]/10 shadow-[0_0_30px_rgba(200,164,103,0.04)] transition duration-300 group-hover:bg-[#c8a467]/15" />

                <h3 className="mt-7 text-xl font-semibold text-[#f1dfbc]">
                  {feature.title}
                </h3>

                <p className="mt-4 text-sm leading-6 text-white/43">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="relative mx-auto max-w-7xl px-6 pb-20">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-[28px] border border-[#c8a467]/20 bg-white/[0.03] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm">
              <p className="text-xs font-semibold tracking-[0.25em] text-[#c8a467]">
                AI WEBSITE ENGINE
              </p>

              <h3 className="mt-4 text-2xl font-semibold text-[#f1dfbc]">
                WedgeWeb
              </h3>

              <p className="mt-4 text-sm leading-6 text-white/38">
                Describe your business, add products or services, connect
                WhatsApp and generate a professional three-page website.
              </p>
              <a href="/wedgeweb" className="mt-6 inline-flex rounded-full bg-[#c8a467] px-6 py-3 font-bold text-[#111416]">Create Free Preview</a>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/[0.022] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm">
              <p className="text-xs font-semibold tracking-[0.25em] text-[#c8a467]">
                EXECUTIVE EXPANSION
              </p>

              <h3 className="mt-4 text-2xl font-semibold text-[#f1dfbc]">
                Reserved for future intelligence capabilities
              </h3>

              <p className="mt-4 text-sm leading-6 text-white/38">
                Future scenario planning, multi-branch comparison and enterprise
                intelligence can be added here when ready.
              </p>
            </div>
          </div>
        </section>

        <footer className="relative border-t border-white/8 bg-black/5 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6 py-9">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-[#f1dfbc]">Wedge Works</p>
                <p className="mt-2 text-sm text-white/32">
                  Workforce Operations & Executive Intelligence
                </p>
              </div>

              <nav
                aria-label="Footer navigation"
                className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/38"
              >
                <a
                  href="/manager-login"
                  className="transition duration-200 hover:text-[#f1dfbc]"
                >
                  Manager Login
                </a>

                <a
                  href="/wedge-i"
                  className="transition duration-200 hover:text-[#f1dfbc]"
                >
                  Wedge-I
                </a>

                <a
                  href="/privacy"
                  className="rounded-full border border-[#c8a467]/35 px-4 py-2 font-semibold text-[#e2c58d] transition duration-200 hover:border-[#c8a467]/60 hover:bg-[#c8a467]/10 hover:text-[#f1dfbc]"
                >
                  Privacy Policy
                </a>

                <a
                  href="mailto:support@wedge-works.com"
                  className="transition duration-200 hover:text-[#f1dfbc]"
                >
                  Support
                </a>
              </nav>
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-white/8 pt-6 text-sm text-white/28 sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 Wedge Works. Built for Malaysian businesses.</p>

              <a
                href="mailto:support@wedge-works.com"
                className="transition duration-200 hover:text-[#f1dfbc]"
              >
                support@wedge-works.com
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}

function ExecutiveBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,#080c0f_0%,#0b1115_42%,#080c0f_100%)]" />

      <div className="absolute -right-[18rem] -top-[22rem] h-[52rem] w-[52rem] rounded-full bg-[#c8a467]/10 blur-[150px] animate-[pulse_18s_ease-in-out_infinite]" />

      <div className="absolute -bottom-[24rem] -left-[20rem] h-[55rem] w-[55rem] rounded-full bg-[#39545f]/12 blur-[170px] animate-[pulse_22s_ease-in-out_infinite]" />

      <div className="absolute left-[34%] top-[32%] h-[32rem] w-[32rem] rounded-full bg-[#795f36]/5 blur-[150px]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_12%,rgba(225,188,121,0.09),transparent_28%),radial-gradient(circle_at_18%_78%,rgba(72,104,115,0.08),transparent_30%),radial-gradient(circle_at_50%_45%,transparent_0%,rgba(4,7,9,0.35)_70%,rgba(4,7,9,0.72)_100%)]" />

      <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />

      <div className="absolute inset-0 opacity-[0.025] [background-image:radial-gradient(rgba(255,255,255,0.75)_0.55px,transparent_0.7px)] [background-size:5px_5px]" />
    </div>
  );
}
