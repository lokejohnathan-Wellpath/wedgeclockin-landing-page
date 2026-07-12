import type { ReactNode } from "react";
import type {
  QuarterlyChartPoint,
  QuarterlyChartSeries,
} from "../../engine/quarterlyReportEngine";

export type ExecutiveChartSeries = QuarterlyChartSeries;

export function ExecutiveChartCard({
  eyebrow,
  title,
  summary,
  children,
}: {
  eyebrow: string;
  title: string;
  summary?: string;
  children: ReactNode;
}) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-[#0c1215] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.22)]">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#c8a467]">
          {eyebrow}
        </p>

        <h3 className="mt-3 text-xl font-semibold text-[#f0ddb8]">
          {title}
        </h3>

        {summary ? (
          <p className="mt-3 text-sm leading-6 text-white/40">
            {summary}
          </p>
        ) : null}
      </header>

      <div className="mt-6">{children}</div>
    </article>
  );
}

export function ExecutiveLineChart({
  points,
  unit,
}: {
  points: QuarterlyChartPoint[];
  unit: "RM" | "score";
}) {
  const chartWidth = 720;
  const chartHeight = 260;
  const paddingX = 48;
  const paddingTop = 28;
  const paddingBottom = 56;

  const values = points.map((point) => point.value);
  const minimumValue = Math.min(...values, 0);
  const maximumValue = Math.max(...values, 1);
  const valueRange = Math.max(maximumValue - minimumValue, 1);

  const usableWidth = chartWidth - paddingX * 2;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const coordinates = points.map((point, index) => {
    const x =
      points.length <= 1
        ? chartWidth / 2
        : paddingX + (index / (points.length - 1)) * usableWidth;

    const normalizedValue =
      (point.value - minimumValue) / valueRange;

    const y =
      paddingTop + usableHeight - normalizedValue * usableHeight;

    return {
      ...point,
      x,
      y,
    };
  });

  const linePath = coordinates
    .map((point, index) =>
      index === 0
        ? `M ${point.x} ${point.y}`
        : `L ${point.x} ${point.y}`,
    )
    .join(" ");

  const areaPath =
    coordinates.length > 0
      ? `${linePath} L ${
          coordinates[coordinates.length - 1].x
        } ${chartHeight - paddingBottom} L ${
          coordinates[0].x
        } ${chartHeight - paddingBottom} Z`
      : "";

  return (
    <div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label="Executive trend chart"
          className="min-w-[560px]"
        >
          <defs>
            <linearGradient
              id="executive-chart-area"
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#c8a467"
                stopOpacity="0.3"
              />
              <stop
                offset="100%"
                stopColor="#c8a467"
                stopOpacity="0.02"
              />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map((line) => {
            const y =
              paddingTop + (line / 3) * usableHeight;

            return (
              <line
                key={line}
                x1={paddingX}
                x2={chartWidth - paddingX}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="1"
              />
            );
          })}

          {areaPath ? (
            <path
              d={areaPath}
              fill="url(#executive-chart-area)"
            />
          ) : null}

          {linePath ? (
            <path
              d={linePath}
              fill="none"
              stroke="#c8a467"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {coordinates.map((point) => (
            <g key={point.label}>
              <circle
                cx={point.x}
                cy={point.y}
                r="7"
                fill="#0c1215"
                stroke="#d8b778"
                strokeWidth="4"
              />

              <text
                x={point.x}
                y={point.y - 18}
                textAnchor="middle"
                fill="rgba(244,239,230,0.8)"
                fontSize="14"
                fontWeight="600"
              >
                {formatChartValue(point.value, unit)}
              </text>

              <text
                x={point.x}
                y={chartHeight - 22}
                textAnchor="middle"
                fill="rgba(255,255,255,0.38)"
                fontSize="13"
              >
                {shortenLabel(point.label)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <ChartMovementSummary points={points} unit={unit} />
    </div>
  );
}

export function ExecutiveHorizontalBars({
  points,
}: {
  points: QuarterlyChartPoint[];
}) {
  return (
    <div className="space-y-5">
      {points.map((point) => {
        const width = Math.max(
          3,
          Math.min(100, Math.round(point.value)),
        );

        return (
          <div key={point.label}>
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-sm text-white/45">
                {point.label}
              </span>

              <span className="text-sm font-semibold text-[#f0ddb8]">
                {Math.round(point.value)}
              </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#957441,#d6b678)] transition-all duration-700"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChartMovementSummary({
  points,
  unit,
}: {
  points: QuarterlyChartPoint[];
  unit: "RM" | "score";
}) {
  const first = points[0]?.value ?? 0;
  const last = points[points.length - 1]?.value ?? 0;
  const difference = last - first;

  const movement =
    difference > 0
      ? "Improving"
      : difference < 0
        ? "Declining"
        : "Stable";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4 text-xs">
      <span className="text-white/30">
        Forecast movement
      </span>

      <span className="font-semibold text-[#c8a467]">
        {movement} ·{" "}
        {difference >= 0 ? "+" : ""}
        {formatChartValue(difference, unit)}
      </span>
    </div>
  );
}

function formatChartValue(
  value: number,
  unit: "RM" | "score",
) {
  if (unit === "score") {
    return Math.round(value).toString();
  }

  const absoluteValue = Math.abs(value);

  if (absoluteValue >= 1_000_000) {
    return `${value < 0 ? "-" : ""}RM ${(absoluteValue / 1_000_000).toFixed(
      1,
    )}m`;
  }

  if (absoluteValue >= 1_000) {
    return `${value < 0 ? "-" : ""}RM ${(absoluteValue / 1_000).toFixed(
      1,
    )}k`;
  }

  return `${value < 0 ? "-" : ""}RM ${Math.round(
    absoluteValue,
  ).toLocaleString("en-MY")}`;
}

function shortenLabel(label: string) {
  if (label.includes("Q1")) return "Q1";
  if (label.includes("Q2")) return "Q2";
  if (label.includes("Q3")) return "Q3";
  if (label.length <= 16) return label;

  return `${label.slice(0, 14)}…`;
}