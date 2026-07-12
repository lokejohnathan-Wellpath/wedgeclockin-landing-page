"use client";

import type {
  ExecutivePattern,
  ExecutivePatternReport,
} from "../engine/executivePatternEngine";

type SpectrePatternPanelProps = {
  report: ExecutivePatternReport;
};

export function SpectrePatternPanel({
  report,
}: SpectrePatternPanelProps) {
  return (
    <section className="rounded-[28px] border border-[#c8a467]/18 bg-[#11171b] p-7 shadow-[0_25px_70px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.26em] text-[#c8a467]">
            SPECTRE PATTERN ENGINE
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-[#f1dfbc]">
            What changed across your saved months
          </h2>
        </div>

        <div className="rounded-full border border-white/8 bg-white/[0.025] px-4 py-2 text-xs text-white/40">
          {report.monthsAnalysed}{" "}
          {report.monthsAnalysed === 1 ? "month" : "months"} analysed
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#c8a467]/16 bg-[#c8a467]/5 p-5">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#c8a467]">
          EXECUTIVE CONCLUSION
        </p>

        <p className="mt-3 text-sm leading-6 text-white/60">
          {report.executiveConclusion}
        </p>
      </div>

      {report.patterns.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/8 bg-[#0c1215] p-6">
          <p className="text-sm leading-6 text-white/45">
            Save at least two monthly reports before Wedge-I can identify
            meaningful trends. Stronger multi-month patterns will appear
            automatically as more history becomes available.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {report.patterns.map((pattern, index) => (
            <PatternCard
              key={pattern.id}
              pattern={pattern}
              index={index}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function PatternCard({
  pattern,
  index,
}: {
  pattern: ExecutivePattern;
  index: number;
}) {
  return (
    <article className="rounded-2xl border border-white/8 bg-[#0c1215] p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c8a467]/25 bg-[#c8a467]/10 text-sm font-bold text-[#d7b576]">
          {String(index + 1).padStart(2, "0")}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-white/28">
                {pattern.priority} priority
              </p>

              <h3 className="mt-2 text-lg font-semibold text-[#f0ddb8]">
                {pattern.title}
              </h3>
            </div>

            <PatternStatus direction={pattern.direction} />
          </div>

          <p className="mt-4 text-sm leading-6 text-white/55">
            {pattern.summary}
          </p>

          <div className="mt-5 border-t border-white/8 pt-4">
            <p className="text-xs font-semibold tracking-[0.14em] text-white/30">
              EVIDENCE
            </p>

            <ul className="mt-3 space-y-2">
              {pattern.evidence.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-xs leading-5 text-white/40"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8a467]/70" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}

function PatternStatus({
  direction,
}: {
  direction: ExecutivePattern["direction"];
}) {
  const labels: Record<ExecutivePattern["direction"], string> = {
    improving: "Improving",
    weakening: "Weakening",
    stable: "Stable",
    watch: "Watch",
  };

  return (
    <span className="w-fit rounded-full border border-[#c8a467]/20 bg-[#c8a467]/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d3b071]">
      {labels[direction]}
    </span>
  );
}