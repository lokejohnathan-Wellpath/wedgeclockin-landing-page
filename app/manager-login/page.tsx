export default function ManagerLoginPage() {
  return (
    <main className="min-h-screen bg-[#101416] text-[#f4efe6]">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-[2rem] border border-[#d4ad63]/40 bg-[#1e2428] p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d4ad63] text-2xl text-black">
              ◷
            </div>

            <p className="text-sm tracking-[0.3em] text-[#d4ad63]">
              WEDGECLOCKIN
            </p>

            <h1 className="mt-3 text-3xl font-bold text-[#f0dfbd]">
              Manager Portal
            </h1>

            <p className="mt-3 text-sm text-white/55">
              View employee face status, attendance status, payroll, payslip,
              leave and CSV export.
            </p>
          </div>

          <form className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Company Registration Number
              </label>
              <input
                type="text"
                placeholder="Example: 202401001234"
                className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-white/70">
                Manager Password
              </label>
              <input
                type="password"
                placeholder="Enter manager password"
                className="w-full rounded-xl border border-white/10 bg-[#101416] px-4 py-3 text-white outline-none focus:border-[#d4ad63]"
              />
            </div>

            <a
              href="/manager-dashboard"
              className="block w-full rounded-full bg-[#d4ad63] px-6 py-4 text-center font-bold text-black hover:bg-[#e4bf75]"
            >
              Manager Login
            </a>
          </form>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/55">
            Secure multi-company access. Managers can only view employees, face
            registration status, attendance records, leave, payroll and payslip
            data within their own company.
          </div>

          <a
            href="/"
            className="mt-6 block text-center text-sm text-[#d4ad63] hover:underline"
          >
            Back to WedgeCLOCKin
          </a>
        </div>
      </section>
    </main>
  );
}