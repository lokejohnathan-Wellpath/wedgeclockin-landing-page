"use client";

import type { ExecutiveHistoryRecord } from "../services/executiveMemoryClient";

type ExecutiveMemoryTimelineProps = {
  history: ExecutiveHistoryRecord[];
  isLoading?: boolean;
  onOpen: (record: ExecutiveHistoryRecord) => void;
  onEdit: (record: ExecutiveHistoryRecord) => void;
};

function formatRM(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);
}

function monthLabel(month: number, year: number) {
  return new Intl.DateTimeFormat("en-MY", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
}

function updatedLabel(record: ExecutiveHistoryRecord) {
  const value = record.updatedAt || record.createdAt;

  if (!value) {
    return "Saved month";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Saved month";
  }

  return `Updated ${new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}

function movement(
  current: ExecutiveHistoryRecord,
  previous?: ExecutiveHistoryRecord,
) {
  if (!previous || previous.metrics.revenue <= 0) {
    return null;
  }

  const percentage =
    ((current.metrics.revenue - previous.metrics.revenue) /
      previous.metrics.revenue) *
    100;

  return {
    percentage,
    label:
      percentage > 0
        ? `Revenue +${percentage.toFixed(1)}%`
        : percentage < 0
          ? `Revenue ${percentage.toFixed(1)}%`
          : "Revenue unchanged",
  };
}

export function ExecutiveMemoryTimeline({
  history,
  isLoading = false,
  onOpen,
  onEdit,
}: ExecutiveMemoryTimelineProps) {
  if (isLoading) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-[#11171b] p-7">
        <p className="text-sm text-white/45">
          Loading executive memory...
        </p>
      </section>
    );
  }

  if (history.length === 0) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-[#11171b] p-7">
        <p className="text-xs font-semibold tracking-[0.25em] text-[#c8a467]">
          EXECUTIVE MEMORY
        </p>

        <h2 className="mt-3 text-2xl font-semibold text-[#f1dfbc]">
          No saved months yet
        </h2>

        <p className="mt-3 text-sm leading-6 text-white/45">
          Generate your first logged-in executive report. It will appear here
          as the first month in your company timeline.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#11171b] p-7 shadow-[0_25px_70px_rgba(0,0,0,0.22)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.25em] text-[#c8a467]">
            EXECUTIVE MEMORY
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-[#f1dfbc]">
            Company timeline
          </h2>
        </div>

        <p className="text-sm text-white/35">
          {history.length} saved {history.length === 1 ? "month" : "months"}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {history.map((record, index) => {
          const previous = history[index + 1];
          const trend = movement(record, previous);

          return (
            <article
              key={record.id}
              className="rounded-2xl border border-white/8 bg-[#0c1215] p-5"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold tracking-[0.16em] text-[#c8a467]">
                      {monthLabel(record.month, record.year)}
                    </p>

                    <p className="text-xs text-white/25">
                      {updatedLabel(record)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <MemoryMetric
                      label="Business health"
                      value={`${record.derived.healthScore} / 100`}
                    />

                    <MemoryMetric
                      label="Revenue"
                      value={formatRM(record.metrics.revenue)}
                    />

                    <MemoryMetric
                      label="Operating profit"
                      value={formatRM(record.derived.operatingProfit)}
                    />
                  </div>

                  {trend ? (
                    <p
                      className={`mt-4 text-sm ${
                        trend.percentage >= 0
                          ? "text-emerald-300/80"
                          : "text-amber-300/80"
                      }`}
                    >
                      {trend.label}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onOpen(record)}
                    className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white/65 transition hover:border-white/25 hover:bg-white/[0.04]"
                  >
                    Open Month
                  </button>

                  <button
                    type="button"
                    onClick={() => onEdit(record)}
                    className="rounded-full border border-[#c8a467]/45 px-6 py-3 text-sm font-semibold text-[#f0ddb8] transition hover:bg-[#c8a467]/10"
                  >
                    Edit Month
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function MemoryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.13em] text-white/28">
        {label}
      </p>

      <p className="mt-2 text-lg font-semibold text-white/75">
        {value}
      </p>
    </div>
  );
}