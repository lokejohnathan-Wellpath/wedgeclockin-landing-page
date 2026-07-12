import type { QuarterlyChartSeries } from "../../engine/quarterlyReportEngine";
import {
  ExecutiveChartCard,
  ExecutiveLineChart,
} from "./ExecutiveChartCard";

export function ProfitChart({
  series,
}: {
  series: QuarterlyChartSeries;
}) {
  return (
    <ExecutiveChartCard
      eyebrow="OPERATING PROFIT"
      title={series.title}
      summary="Operating-profit movement highlights whether projected growth is translating into stronger financial performance."
    >
      <ExecutiveLineChart
        points={series.points}
        unit={series.unit}
      />
    </ExecutiveChartCard>
  );
}