import type { BusinessType } from "../engine/benchmarks";
import type { WedgeCeoReport } from "../engine/wedgeCeoEngine";

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

function round(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

function findHealthScore(report: WedgeCeoReport) {
  const score = report.quarterlyReport.businessHealth.score;

  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function hasExecutiveMemorySession() {
  return Boolean(getManagerToken());
}

export function buildExecutiveSnapshot(
  input: ExecutiveMemoryInput,
  report: WedgeCeoReport,
): Omit<
  ExecutiveHistoryRecord,
  "companyId" | "companyCode" | "createdAt" | "updatedAt"
> {
  const now = new Date();

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
      ? (operatingProfit / input.monthlyRevenue) * 100
      : 0;

  const labourPercent =
    input.monthlyRevenue > 0
      ? (input.monthlyPayroll / input.monthlyRevenue) * 100
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
      ? (input.inventoryValue / input.monthlyRevenue) * 100
      : 0;

  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return {
    id: `executive_${year}_${String(month).padStart(2, "0")}`,

    businessType: input.businessType,
    businessProfile: input.businessType,

    month,
    year,

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
      grossMarginPercent: round(grossMarginPercent),
      profitMarginPercent: round(profitMarginPercent),
      labourPercent: round(labourPercent),
      revenuePerStaff: round(revenuePerStaff),
      cashRunwayMonths: round(cashRunwayMonths),
      inventoryToRevenuePercent: round(
        inventoryToRevenuePercent,
      ),
      healthScore: findHealthScore(report),
    },

    dataSource: "manual",
    dataCompletenessScore: 75,

    notes: `Wedge-I executive snapshot for ${input.companyName}.`,
  };
}

export async function saveExecutiveSnapshot(
  input: ExecutiveMemoryInput,
  report: WedgeCeoReport,
) {
  const token = getManagerToken();

  if (!token) {
    return null;
  }

  const apiBaseUrl = getApiBaseUrl();
  const snapshot = buildExecutiveSnapshot(input, report);

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

export async function loadExecutiveHistory(limit = 3) {
  const token = getManagerToken();

  if (!token) {
    return [];
  }

  const apiBaseUrl = getApiBaseUrl();

  const response = await fetch(
    `${apiBaseUrl}/api/executive-history?limit=${limit}`,
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