import type { QuarterlyChartSeries } from "../../engine/quarterlyReportEngine";
import {
  ExecutiveChartCard,
  ExecutiveHorizontalBars,
} from "./ExecutiveChartCard";

export function ScorecardChart({
  series,
}: {
  series: QuarterlyChartSeries;
}) {
  const weakestArea = [...series.points].sort(
    (first, second) => first.value - second.value,
  )[0];

  return (
    <ExecutiveChartCard
      eyebrow="EXECUTIVE SCORECARD"
      title={series.title}
      summary={
        weakestArea
          ? `${weakestArea.label} is currently the lowest-scoring management area and should receive closer attention.`
          : "Executive scores will appear after business analysis."
      }
    >
      <ExecutiveHorizontalBars points={series.points} />
    </ExecutiveChartCard>
  );
}