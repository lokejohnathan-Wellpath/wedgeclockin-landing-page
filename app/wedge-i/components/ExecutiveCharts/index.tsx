import type { QuarterlyReportChartData } from "../../engine/quarterlyReportEngine";

import { CashChart } from "./CashChart";
import { ProfitChart } from "./ProfitChart";
import { RevenueChart } from "./RevenueChart";
import { ScorecardChart } from "./ScorecardChart";

export function ExecutiveCharts({
  chartData,
}: {
  chartData: QuarterlyReportChartData;
}) {
  const revenue = chartData.series.find(
    (series) => series.key === "revenue",
  );

  const profit = chartData.series.find(
    (series) => series.key === "operating-profit",
  );

  const cash = chartData.series.find(
    (series) => series.key === "cash-position",
  );

  const scorecard = chartData.series.find(
    (series) => series.key === "business-health",
  );

  return (
    <section className="rounded-[32px] border border-white/10 bg-[#11171b] p-7 shadow-[0_25px_70px_rgba(0,0,0,0.25)] sm:p-9">
      <header>
        <p className="text-xs font-semibold tracking-[0.26em] text-[#c8a467]">
          EXECUTIVE CHARTS
        </p>

        <h2 className="mt-3 text-2xl font-semibold text-[#f1dfbc]">
          Performance at a glance
        </h2>

        <p className="mt-3 max-w-4xl text-sm leading-6 text-white/42">
          Visual evidence supporting the quarterly outlook, operating
          performance and Wedge-CEO business-health assessment.
        </p>
      </header>

      <div className="mt-7 grid gap-6 xl:grid-cols-2">
        {revenue ? <RevenueChart series={revenue} /> : null}
        {profit ? <ProfitChart series={profit} /> : null}
        {cash ? <CashChart series={cash} /> : null}
        {scorecard ? (
          <ScorecardChart series={scorecard} />
        ) : null}
      </div>
    </section>
  );
}

export { CashChart } from "./CashChart";
export { ProfitChart } from "./ProfitChart";
export { RevenueChart } from "./RevenueChart";
export { ScorecardChart } from "./ScorecardChart";