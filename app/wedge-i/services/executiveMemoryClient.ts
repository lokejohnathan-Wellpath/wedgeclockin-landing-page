import type { BusinessType } from "../engine/benchmarks";
import type { WedgeCeoReport } from "../engine/wedgeCeoEngine";

export type ExecutiveReportPeriod = { month: number; year: number };

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
  companyName?: string;
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

type HistoryResponse = { success: boolean; count: number; history: ExecutiveHistoryRecord[] };
type SaveResponse = { success: boolean; history: ExecutiveHistoryRecord };
type FreeMemoryStore = {
  version: 1;
  activeCompanyCode: string;
  businesses: Record<string, { companyName: string; history: ExecutiveHistoryRecord[]; touchedAt: string }>;
};

const EARLIEST_REPORT_YEAR = 2026;
const EARLIEST_REPORT_MONTH = 1;
const FREE_MEMORY_KEY = "wedge_i_free_memory_v1";
const FREE_MONTH_LIMIT = 3;
const FREE_BUSINESS_LIMIT = 3;

function getApiBaseUrl() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) throw new Error("API service is not configured.");
  return apiBaseUrl;
}

function getManagerToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wc_manager_token");
}

function getCompanyCode() {
  if (typeof window === "undefined") return "company";
  return localStorage.getItem("wc_company_code")?.trim() || "company";
}

function sanitiseIdPart(value: string) {
  const sanitised = value.trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  return sanitised || "COMPANY";
}

function freeCompanyCode(companyName: string) {
  return `FREE_${sanitiseIdPart(companyName).slice(0, 36)}`;
}

function round(value: number) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;
}

function findHealthScore(report: WedgeCeoReport) {
  const score = report.quarterlyReport.businessHealth.score;
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function validateReportPeriod(period: ExecutiveReportPeriod) {
  const { month, year } = period;
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error("Report month must be between January and December.");
  if (!Number.isInteger(year) || year < EARLIEST_REPORT_YEAR) throw new Error("Executive memory begins from January 2026.");
  if (year === EARLIEST_REPORT_YEAR && month < EARLIEST_REPORT_MONTH) throw new Error("Executive memory begins from January 2026.");
  const now = new Date();
  if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1)) {
    throw new Error("Future reporting months cannot be saved.");
  }
}

function readFreeMemory(): FreeMemoryStore {
  const empty: FreeMemoryStore = { version: 1, activeCompanyCode: "", businesses: {} };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(FREE_MEMORY_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as FreeMemoryStore;
    if (parsed?.version !== 1 || typeof parsed.businesses !== "object") return empty;
    return parsed;
  } catch {
    return empty;
  }
}

function writeFreeMemory(store: FreeMemoryStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FREE_MEMORY_KEY, JSON.stringify(store));
}

function sortHistory(history: ExecutiveHistoryRecord[]) {
  return [...history].sort((a, b) => b.year - a.year || b.month - a.month);
}

export function hasExecutiveMemorySession() {
  return typeof window !== "undefined";
}

export function getExecutiveMemoryMode(): "cloud" | "browser" {
  return getManagerToken() ? "cloud" : "browser";
}

export function buildExecutiveSnapshot(
  input: ExecutiveMemoryInput,
  report: WedgeCeoReport,
  period: ExecutiveReportPeriod,
): Omit<ExecutiveHistoryRecord, "companyId" | "companyCode" | "createdAt" | "updatedAt"> {
  validateReportPeriod(period);
  const totalOperatingCost = input.monthlyExpenses + input.monthlyPayroll;
  const grossProfit = input.monthlyRevenue;
  const operatingProfit = input.monthlyRevenue - totalOperatingCost;
  const grossMarginPercent = input.monthlyRevenue > 0 ? (grossProfit / input.monthlyRevenue) * 100 : 0;
  const profitMarginPercent = input.monthlyRevenue > 0 ? (operatingProfit / input.monthlyRevenue) * 100 : 0;
  const labourPercent = input.monthlyRevenue > 0 ? (input.monthlyPayroll / input.monthlyRevenue) * 100 : 0;
  const revenuePerStaff = input.staffCount > 0 ? input.monthlyRevenue / input.staffCount : 0;
  const cashRunwayMonths = totalOperatingCost > 0 ? input.cashInBank / totalOperatingCost : 0;
  const inventoryToRevenuePercent = input.monthlyRevenue > 0 ? (input.inventoryValue / input.monthlyRevenue) * 100 : 0;
  const companyCode = getManagerToken() ? sanitiseIdPart(getCompanyCode()) : freeCompanyCode(input.companyName);
  const monthPart = String(period.month).padStart(2, "0");

  return {
    id: `executive_${companyCode}_${period.year}_${monthPart}`,
    companyName: input.companyName.trim(),
    businessType: input.businessType,
    businessProfile: input.businessType,
    month: period.month,
    year: period.year,
    metrics: {
      revenue: round(input.monthlyRevenue), expenses: round(input.monthlyExpenses), payroll: round(input.monthlyPayroll), cogs: 0,
      cash: round(input.cashInBank), inventory: round(input.inventoryValue), staffCount: round(input.staffCount),
    },
    workforce: { activeEmployees: null, attendanceRate: null, absenceRate: null, overtimeHours: null, leaveDays: null },
    derived: {
      grossProfit: round(grossProfit), operatingProfit: round(operatingProfit), grossMarginPercent: round(grossMarginPercent),
      profitMarginPercent: round(profitMarginPercent), labourPercent: round(labourPercent), revenuePerStaff: round(revenuePerStaff),
      cashRunwayMonths: round(cashRunwayMonths), inventoryToRevenuePercent: round(inventoryToRevenuePercent), healthScore: findHealthScore(report),
    },
    dataSource: "manual",
    dataCompletenessScore: 75,
    notes: `Wedge-I executive snapshot for ${input.companyName}, ${period.year}-${monthPart}.`,
  };
}

function saveFreeSnapshot(input: ExecutiveMemoryInput, snapshot: ReturnType<typeof buildExecutiveSnapshot>) {
  const now = new Date().toISOString();
  const companyCode = freeCompanyCode(input.companyName);
  const store = readFreeMemory();
  const existingBucket = store.businesses[companyCode];
  const existing = existingBucket?.history.find((record) => record.year === snapshot.year && record.month === snapshot.month);
  const record: ExecutiveHistoryRecord = {
    ...snapshot,
    companyId: companyCode.toLowerCase(),
    companyCode,
    companyName: input.companyName.trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  const history = sortHistory([record, ...(existingBucket?.history || []).filter((item) => !(item.year === record.year && item.month === record.month))]).slice(0, FREE_MONTH_LIMIT);
  store.businesses[companyCode] = { companyName: input.companyName.trim(), history, touchedAt: now };
  store.activeCompanyCode = companyCode;

  const keepCodes = Object.entries(store.businesses)
    .sort(([, a], [, b]) => b.touchedAt.localeCompare(a.touchedAt))
    .slice(0, FREE_BUSINESS_LIMIT)
    .map(([code]) => code);
  Object.keys(store.businesses).forEach((code) => { if (!keepCodes.includes(code)) delete store.businesses[code]; });
  writeFreeMemory(store);
  return record;
}

export async function saveExecutiveSnapshot(input: ExecutiveMemoryInput, report: WedgeCeoReport, period: ExecutiveReportPeriod) {
  validateReportPeriod(period);
  const snapshot = buildExecutiveSnapshot(input, report, period);
  const token = getManagerToken();
  if (!token) return saveFreeSnapshot(input, snapshot);

  const response = await fetch(`${getApiBaseUrl()}/api/executive-history`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(snapshot),
  });
  const data = (await response.json()) as SaveResponse | { success?: boolean; message?: string };
  if (!response.ok) throw new Error("message" in data && data.message ? data.message : "Executive memory could not be saved.");
  return (data as SaveResponse).history;
}

export async function loadExecutiveHistory(limit = 36) {
  const token = getManagerToken();
  if (!token) {
    const store = readFreeMemory();
    const active = store.businesses[store.activeCompanyCode];
    return sortHistory(active?.history || []).slice(0, Math.min(Math.max(Math.trunc(limit), 1), FREE_MONTH_LIMIT));
  }

  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 120);
  const response = await fetch(`${getApiBaseUrl()}/api/executive-history?limit=${safeLimit}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await response.json()) as HistoryResponse | { success?: boolean; message?: string };
  if (!response.ok) throw new Error("message" in data && data.message ? data.message : "Executive history could not be loaded.");
  return (data as HistoryResponse).history;
}
