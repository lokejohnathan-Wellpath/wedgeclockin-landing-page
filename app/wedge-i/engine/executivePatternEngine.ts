import type { ExecutiveHistoryRecord } from "../services/executiveMemoryClient";

export type PatternDirection =
  | "improving"
  | "weakening"
  | "stable"
  | "watch";

export type ExecutivePattern = {
  id: string;
  title: string;
  summary: string;
  direction: PatternDirection;
  priority: "high" | "medium" | "low";
  evidence: string[];
};

export type ExecutivePatternReport = {
  monthsAnalysed: number;
  patterns: ExecutivePattern[];
  executiveConclusion: string;
};

type MetricPoint = {
  label: string;
  value: number;
};

function safePercentChange(previous: number, current: number) {
  if (!Number.isFinite(previous) || !Number.isFinite(current)) {
    return 0;
  }

  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

function round(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 10) / 10;
}

function monthLabel(record: ExecutiveHistoryRecord) {
  return new Intl.DateTimeFormat("en-MY", {
    month: "short",
    year: "numeric",
  }).format(new Date(record.year, record.month - 1, 1));
}

function orderedHistory(history: ExecutiveHistoryRecord[]) {
  return [...history].sort((left, right) => {
    const leftKey = left.year * 100 + left.month;
    const rightKey = right.year * 100 + right.month;

    return leftKey - rightKey;
  });
}

function isConsecutiveGrowth(points: MetricPoint[]) {
  if (points.length < 3) {
    return false;
  }

  return points.every((point, index) => {
    if (index === 0) {
      return true;
    }

    return point.value > points[index - 1].value;
  });
}

function isConsecutiveDecline(points: MetricPoint[]) {
  if (points.length < 3) {
    return false;
  }

  return points.every((point, index) => {
    if (index === 0) {
      return true;
    }

    return point.value < points[index - 1].value;
  });
}

function formatRM(value: number) {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: "MYR",
    maximumFractionDigits: 0,
  }).format(value);
}

function createRevenuePattern(
  records: ExecutiveHistoryRecord[],
): ExecutivePattern | null {
  const points = records.map((record) => ({
    label: monthLabel(record),
    value: record.metrics.revenue,
  }));

  const first = points[0];
  const latest = points[points.length - 1];

  if (!first || !latest || points.length < 2) {
    return null;
  }

  const change = round(
    safePercentChange(first.value, latest.value),
  );

  if (isConsecutiveGrowth(points)) {
    return {
      id: "revenue-consecutive-growth",
      title: "Revenue growth momentum",
      summary: `Revenue increased across ${points.length} consecutive months, rising ${change}% from ${first.label} to ${latest.label}.`,
      direction: "improving",
      priority: "medium",
      evidence: points.map(
        (point) => `${point.label}: ${formatRM(point.value)}`,
      ),
    };
  }

  if (isConsecutiveDecline(points)) {
    return {
      id: "revenue-consecutive-decline",
      title: "Revenue decline detected",
      summary: `Revenue declined across ${points.length} consecutive months, falling ${Math.abs(
        change,
      )}% from ${first.label} to ${latest.label}.`,
      direction: "weakening",
      priority: "high",
      evidence: points.map(
        (point) => `${point.label}: ${formatRM(point.value)}`,
      ),
    };
  }

  if (Math.abs(change) < 3) {
    return {
      id: "revenue-stable",
      title: "Revenue remains broadly stable",
      summary: `Revenue changed by only ${change}% across the analysed period.`,
      direction: "stable",
      priority: "low",
      evidence: [
        `${first.label}: ${formatRM(first.value)}`,
        `${latest.label}: ${formatRM(latest.value)}`,
      ],
    };
  }

  return {
    id: "revenue-movement",
    title: change > 0 ? "Revenue improved" : "Revenue weakened",
    summary:
      change > 0
        ? `Revenue improved by ${change}% across the analysed period.`
        : `Revenue weakened by ${Math.abs(
            change,
          )}% across the analysed period.`,
    direction: change > 0 ? "improving" : "weakening",
    priority: change > 0 ? "low" : "medium",
    evidence: [
      `${first.label}: ${formatRM(first.value)}`,
      `${latest.label}: ${formatRM(latest.value)}`,
    ],
  };
}

function createPayrollPressurePattern(
  records: ExecutiveHistoryRecord[],
): ExecutivePattern | null {
  if (records.length < 2) {
    return null;
  }

  const first = records[0];
  const latest = records[records.length - 1];

  const revenueChange = safePercentChange(
    first.metrics.revenue,
    latest.metrics.revenue,
  );

  const payrollChange = safePercentChange(
    first.metrics.payroll,
    latest.metrics.payroll,
  );

  const labourRatioChange =
    latest.derived.labourPercent -
    first.derived.labourPercent;

  if (
    payrollChange > revenueChange + 5 ||
    labourRatioChange > 3
  ) {
    return {
      id: "payroll-pressure",
      title: "Payroll is rising faster than revenue",
      summary: `Payroll increased ${round(
        payrollChange,
      )}% while revenue changed ${round(
        revenueChange,
      )}%. Labour cost ratio moved from ${round(
        first.derived.labourPercent,
      )}% to ${round(latest.derived.labourPercent)}%.`,
      direction: "watch",
      priority: "high",
      evidence: [
        `Payroll: ${formatRM(
          first.metrics.payroll,
        )} → ${formatRM(latest.metrics.payroll)}`,
        `Revenue: ${formatRM(
          first.metrics.revenue,
        )} → ${formatRM(latest.metrics.revenue)}`,
        `Labour ratio: ${round(
          first.derived.labourPercent,
        )}% → ${round(latest.derived.labourPercent)}%`,
      ],
    };
  }

  if (
    revenueChange > payrollChange + 5 &&
    labourRatioChange < 0
  ) {
    return {
      id: "labour-efficiency-improving",
      title: "Labour efficiency is improving",
      summary: `Revenue growth exceeded payroll growth while labour cost ratio improved by ${Math.abs(
        round(labourRatioChange),
      )} percentage points.`,
      direction: "improving",
      priority: "medium",
      evidence: [
        `Revenue change: ${round(revenueChange)}%`,
        `Payroll change: ${round(payrollChange)}%`,
        `Labour ratio: ${round(
          first.derived.labourPercent,
        )}% → ${round(latest.derived.labourPercent)}%`,
      ],
    };
  }

  return null;
}

function createCashPattern(
  records: ExecutiveHistoryRecord[],
): ExecutivePattern | null {
  if (records.length < 2) {
    return null;
  }

  const first = records[0];
  const latest = records[records.length - 1];

  const cashChange = round(
    safePercentChange(
      first.metrics.cash,
      latest.metrics.cash,
    ),
  );

  const runwayChange =
    latest.derived.cashRunwayMonths -
    first.derived.cashRunwayMonths;

  if (cashChange <= -10 || runwayChange <= -0.5) {
    return {
      id: "cash-weakening",
      title: "Cash position is weakening",
      summary: `Cash moved ${cashChange}% across the analysed period and runway changed from ${round(
        first.derived.cashRunwayMonths,
      )} to ${round(latest.derived.cashRunwayMonths)} months.`,
      direction: "weakening",
      priority: "high",
      evidence: [
        `Cash: ${formatRM(
          first.metrics.cash,
        )} → ${formatRM(latest.metrics.cash)}`,
        `Runway: ${round(
          first.derived.cashRunwayMonths,
        )} → ${round(latest.derived.cashRunwayMonths)} months`,
      ],
    };
  }

  if (cashChange >= 10 || runwayChange >= 0.5) {
    return {
      id: "cash-strengthening",
      title: "Cash position is strengthening",
      summary: `Cash improved ${cashChange}% and runway expanded to ${round(
        latest.derived.cashRunwayMonths,
      )} months.`,
      direction: "improving",
      priority: "medium",
      evidence: [
        `Cash: ${formatRM(
          first.metrics.cash,
        )} → ${formatRM(latest.metrics.cash)}`,
        `Runway: ${round(
          first.derived.cashRunwayMonths,
        )} → ${round(latest.derived.cashRunwayMonths)} months`,
      ],
    };
  }

  return null;
}

function createInventoryPattern(
  records: ExecutiveHistoryRecord[],
): ExecutivePattern | null {
  if (records.length < 3) {
    return null;
  }

  const points = records.map((record) => ({
    label: monthLabel(record),
    value: record.metrics.inventory,
  }));

  if (!isConsecutiveGrowth(points)) {
    return null;
  }

  const first = records[0];
  const latest = records[records.length - 1];

  const inventoryChange = round(
    safePercentChange(
      first.metrics.inventory,
      latest.metrics.inventory,
    ),
  );

  const revenueChange = round(
    safePercentChange(
      first.metrics.revenue,
      latest.metrics.revenue,
    ),
  );

  if (inventoryChange > revenueChange + 10) {
    return {
      id: "inventory-accumulation",
      title: "Inventory accumulation detected",
      summary: `Inventory increased ${inventoryChange}% while revenue changed ${revenueChange}%. Stock is accumulating faster than sales.`,
      direction: "watch",
      priority: "high",
      evidence: points.map(
        (point) => `${point.label}: ${formatRM(point.value)}`,
      ),
    };
  }

  return null;
}

function createMarginPattern(
  records: ExecutiveHistoryRecord[],
): ExecutivePattern | null {
  if (records.length < 2) {
    return null;
  }

  const first = records[0];
  const latest = records[records.length - 1];

  const marginChange =
    latest.derived.profitMarginPercent -
    first.derived.profitMarginPercent;

  if (marginChange <= -3) {
    return {
      id: "margin-deterioration",
      title: "Profit margin is deteriorating",
      summary: `Profit margin declined by ${Math.abs(
        round(marginChange),
      )} percentage points.`,
      direction: "weakening",
      priority: "high",
      evidence: [
        `${monthLabel(first)}: ${round(
          first.derived.profitMarginPercent,
        )}%`,
        `${monthLabel(latest)}: ${round(
          latest.derived.profitMarginPercent,
        )}%`,
      ],
    };
  }

  if (marginChange >= 3) {
    return {
      id: "margin-improvement",
      title: "Profit margin is improving",
      summary: `Profit margin improved by ${round(
        marginChange,
      )} percentage points.`,
      direction: "improving",
      priority: "medium",
      evidence: [
        `${monthLabel(first)}: ${round(
          first.derived.profitMarginPercent,
        )}%`,
        `${monthLabel(latest)}: ${round(
          latest.derived.profitMarginPercent,
        )}%`,
      ],
    };
  }

  return null;
}

function buildConclusion(patterns: ExecutivePattern[]) {
  if (patterns.length === 0) {
    return "There is not yet enough movement in the available history to identify a material executive pattern.";
  }

  const highPriority = patterns.filter(
    (pattern) => pattern.priority === "high",
  );

  const improving = patterns.filter(
    (pattern) => pattern.direction === "improving",
  );

  if (highPriority.length > 0) {
    return `The strongest management signal is ${highPriority[0].title.toLowerCase()}. Review the underlying evidence before making new hiring, purchasing or expansion commitments.`;
  }

  if (improving.length > 0) {
    return `The available history indicates improving momentum, led by ${improving[0].title.toLowerCase()}. Continue monitoring whether this improvement is sustained in the next reporting month.`;
  }

  return "The business remains broadly stable, with no severe pattern detected in the available history.";
}

export function analyseExecutivePatterns(
  history: ExecutiveHistoryRecord[],
): ExecutivePatternReport {
  const records = orderedHistory(history);

  if (records.length < 2) {
    return {
      monthsAnalysed: records.length,
      patterns: [],
      executiveConclusion:
        "At least two saved months are required before Wedge-I can detect meaningful patterns.",
    };
  }

  const candidates = [
    createRevenuePattern(records),
    createPayrollPressurePattern(records),
    createCashPattern(records),
    createInventoryPattern(records),
    createMarginPattern(records),
  ].filter(
    (pattern): pattern is ExecutivePattern => pattern !== null,
  );

  const priorityOrder = {
    high: 0,
    medium: 1,
    low: 2,
  };

  const patterns = candidates.sort(
    (left, right) =>
      priorityOrder[left.priority] -
      priorityOrder[right.priority],
  );

  return {
    monthsAnalysed: records.length,
    patterns,
    executiveConclusion: buildConclusion(patterns),
  };
}