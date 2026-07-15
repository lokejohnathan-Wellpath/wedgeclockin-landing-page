import type { BusinessType } from "../engine/benchmarks";
import type { WedgeCeoReport } from "../engine/wedgeCeoEngine";

export type ExecutiveReportPeriod = {
  month: number;
  year: number;
};

export type ExecutiveMemoryInput = {
  companyName: string;
  businessType: BusinessType;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyPayroll: number;
  staffCount: number;
  cashInBank: number;
  inventoryValue: number;
};

export type ExecutiveHistoryRecord = {
  id: string;
  companyId: string;
  companyCode: string;
  businessType: BusinessType;
  businessProfile?: string;
  month: number;
  year: number;

  metrics: {
    revenue: number;
    expenses: number;
    payroll: number;
    cogs: number;
    cash: number;
    inventory: number;
    staffCount: number;
  };

  workforce?: {
    activeEmployees: number | null;
    attendanceRate: number | null;
    absenceRate: number | null;
    overtimeHours: number | null;
    leaveDays: number | null;
  };

  derived: {
    grossProfit: number;
    operatingProfit: number;
    grossMarginPercent: number;
    profitMarginPercent: number;
    labourPercent: number;
    revenuePerStaff: number;
    cashRunwayMonths: number;
    inventoryToRevenuePercent: number;
    healthScore: number;
  };

  dataSource: "manual" | "integrated" | "mixed";
  dataCompletenessScore: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

type HistoryResponse = {
  success: boolean;
  count: number;
  history: ExecutiveHistoryRecord[];
};

type SaveResponse = {
  success: boolean;
  history: ExecutiveHistoryRecord;
};

const EARLIEST_REPORT_YEAR = 2026;
const EARLIEST_REPORT_MONTH = 1;

function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("API service is not configured.");
  }

  return apiBaseUrl;
}

function getManagerToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("wc_manager_token");
}

function getCompanyCode() {
  if (typeof window === "undefined") {
    return "company";
  }

  return (
    localStorage.getItem("wc_company_code")?.trim() ||
    "company"
  );
}

function sanitiseIdPart(value: string) {
  const sanitised = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return sanitised || "COMPANY";
}

function round(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

function findHealthScore(report: WedgeCeoReport) {
  const score =
    report.quarterlyReport.businessHealth.score;

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, Math.round(score)),
  );
}

function validateReportPeriod(
  period: ExecutiveReportPeriod,
) {
  const { month, year } = period;

  if (
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      "Report month must be between January and December.",
    );
  }

  if (
    !Number.isInteger(year) ||
    year < EARLIEST_REPORT_YEAR
  ) {
    throw new Error(
      "Executive memory begins from January 2026.",
    );
  }

  if (
    year === EARLIEST_REPORT_YEAR &&
    month < EARLIEST_REPORT_MONTH
  ) {
    throw new Error(
      "Executive memory begins from January 2026.",
    );
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (
    year > currentYear ||
    (year === currentYear && month > currentMonth)
  ) {
    throw new Error(
      "Future reporting months cannot be saved.",
    );
  }
}

export function hasExecutiveMemorySession() {
  return Boolean(getManagerToken());
}

export function buildExecutiveSnapshot(
  input: ExecutiveMemoryInput,
  report: WedgeCeoReport,
  period: ExecutiveReportPeriod,
): Omit<
  ExecutiveHistoryRecord,
  | "companyId"
  | "companyCode"
  | "createdAt"
  | "updatedAt"
> {
  validateReportPeriod(period);

  const totalOperatingCost =
    input.monthlyExpenses + input.monthlyPayroll;

  const grossProfit = input.monthlyRevenue;

  const operatingProfit =
    input.monthlyRevenue - totalOperatingCost;

  const grossMarginPercent =
    input.monthlyRevenue > 0
      ? (grossProfit / input.monthlyRevenue) * 100
      : 0;

  const profitMarginPercent =
    input.monthlyRevenue > 0
      ? (operatingProfit /
          input.monthlyRevenue) *
        100
      : 0;

  const labourPercent =
    input.monthlyRevenue > 0
      ? (input.monthlyPayroll /
          input.monthlyRevenue) *
        100
      : 0;

  const revenuePerStaff =
    input.staffCount > 0
      ? input.monthlyRevenue / input.staffCount
      : 0;

  const cashRunwayMonths =
    totalOperatingCost > 0
      ? input.cashInBank / totalOperatingCost
      : 0;

  const inventoryToRevenuePercent =
    input.monthlyRevenue > 0
      ? (input.inventoryValue /
          input.monthlyRevenue) *
        100
      : 0;

  const companyCode = sanitiseIdPart(
    getCompanyCode(),
  );

  const monthPart = String(period.month).padStart(
    2,
    "0",
  );

  return {
    id: `executive_${companyCode}_${period.year}_${monthPart}`,

    businessType: input.businessType,
    businessProfile: input.businessType,

    month: period.month,
    year: period.year,

    metrics: {
      revenue: round(input.monthlyRevenue),
      expenses: round(input.monthlyExpenses),
      payroll: round(input.monthlyPayroll),
      cogs: 0,
      cash: round(input.cashInBank),
      inventory: round(input.inventoryValue),
      staffCount: round(input.staffCount),
    },

    workforce: {
      activeEmployees: null,
      attendanceRate: null,
      absenceRate: null,
      overtimeHours: null,
      leaveDays: null,
    },

    derived: {
      grossProfit: round(grossProfit),
      operatingProfit: round(operatingProfit),
      grossMarginPercent: round(
        grossMarginPercent,
      ),
      profitMarginPercent: round(
        profitMarginPercent,
      ),
      labourPercent: round(labourPercent),
      revenuePerStaff: round(revenuePerStaff),
      cashRunwayMonths: round(
        cashRunwayMonths,
      ),
      inventoryToRevenuePercent: round(
        inventoryToRevenuePercent,
      ),
      healthScore: findHealthScore(report),
    },

    dataSource: "manual",
    dataCompletenessScore: 75,

    notes: `Wedge-I executive snapshot for ${input.companyName}, ${period.year}-${monthPart}.`,
  };
}

export async function saveExecutiveSnapshot(
  input: ExecutiveMemoryInput,
  report: WedgeCeoReport,
  period: ExecutiveReportPeriod,
) {
  const token = getManagerToken();

  if (!token) {
    return null;
  }

  validateReportPeriod(period);

  const apiBaseUrl = getApiBaseUrl();

  const snapshot = buildExecutiveSnapshot(
    input,
    report,
    period,
  );

  const response = await fetch(
    `${apiBaseUrl}/api/executive-history`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(snapshot),
    },
  );

  const data = (await response.json()) as
    | SaveResponse
    | {
        success?: boolean;
        message?: string;
      };

  if (!response.ok) {
    throw new Error(
      "message" in data && data.message
        ? data.message
        : "Executive memory could not be saved.",
    );
  }

  return (data as SaveResponse).history;
}

export async function loadExecutiveHistory(
  limit = 36,
) {
  const token = getManagerToken();

  if (!token) {
    return [];
  }

  const safeLimit = Math.min(
    Math.max(Math.trunc(limit), 1),
    120,
  );

  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(
    `${apiBaseUrl}/api/executive-history?limit=${safeLimit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = (await response.json()) as
    | HistoryResponse
    | {
        success?: boolean;
        message?: string;
      };

  if (!response.ok) {
    throw new Error(
      "message" in data && data.message
        ? data.message
        : "Executive history could not be loaded.",
    );
  }

  return (data as HistoryResponse).history;
}