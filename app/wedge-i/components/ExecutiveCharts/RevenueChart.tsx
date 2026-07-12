import type { QuarterlyChartSeries } from "../../engine/quarterlyReportEngine";
import {
  ExecutiveChartCard,
  ExecutiveLineChart,
} from "./ExecutiveChartCard";

export function RevenueChart({
  series,
}: {
  series: QuarterlyChartSeries;
}) {
  return (
    <ExecutiveChartCard
      eyebrow="REVENUE OUTLOOK"
      title={series.title}
      summary="Projected quarterly revenue based on current financial performance, industry benchmarks and operating conditions."
    >
      <ExecutiveLineChart
        points={series.points}
        unit={series.unit}
      />
    </ExecutiveChartCard>
  );
}