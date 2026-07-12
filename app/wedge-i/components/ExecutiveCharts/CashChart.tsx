import type { QuarterlyChartSeries } from "../../engine/quarterlyReportEngine";
import {
  ExecutiveChartCard,
  ExecutiveLineChart,
} from "./ExecutiveChartCard";

export function CashChart({
  series,
}: {
  series: QuarterlyChartSeries;
}) {
  return (
    <ExecutiveChartCard
      eyebrow="CASH POSITION"
      title={series.title}
      summary="Projected cash position after expected operating performance across the management outlook period."
    >
      <ExecutiveLineChart
        points={series.points}
        unit={series.unit}
      />
    </ExecutiveChartCard>
  );
}