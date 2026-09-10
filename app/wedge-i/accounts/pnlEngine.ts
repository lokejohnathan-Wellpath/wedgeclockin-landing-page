import { getIndustryPnlTemplate } from "./pnlTemplates";
import type { ManagedAccountIndustry, MasterPnlGroup, PnlAccountLine } from "./types";

export type PnlValueMap = Record<string, number | undefined>;

export type CalculatedPnlLine = PnlAccountLine & {
  amount: number;
  percentOfRevenue: number;
};

export type CalculatedIndustryPnl = {
  industry: ManagedAccountIndustry;
  revenueLines: CalculatedPnlLine[];
  directCostLines: CalculatedPnlLine[];
  operatingExpenseLines: CalculatedPnlLine[];
  totals: {
    revenue: number;
    directCost: number;
    grossProfit: number;
    grossMarginPercent: number;
    operatingExpenses: number;
    operatingProfit: number;
    operatingMarginPercent: number;
    otherIncome: number;
    financeCost: number;
    otherNonOperating: number;
    profitBeforeTax: number;
    profitBeforeTaxMarginPercent: number;
  };
  groupTotals: Record<MasterPnlGroup, number>;
  kpis: string[];
};

const ALL_GROUPS: MasterPnlGroup[] = [
  "revenue",
  "direct_cost",
  "staff_cost",
  "occupancy",
  "utilities",
  "sales_marketing",
  "transport_logistics",
  "repairs_maintenance",
  "administration",
  "professional_technology",
  "depreciation",
  "other_operating_expense",
  "other_income",
  "finance_cost",
  "other_non_operating",
];

function round(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function safeValue(values: PnlValueMap, code: string) {
  const value = values[code];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sum(lines: CalculatedPnlLine[]) {
  return round(lines.reduce((total, item) => total + item.amount, 0));
}

function percent(amount: number, revenue: number) {
  return revenue > 0 ? round((amount / revenue) * 100) : 0;
}

function calculateLines(lines: PnlAccountLine[], values: PnlValueMap, revenue: number) {
  return lines.map((item) => ({
    ...item,
    amount: round(safeValue(values, item.code)),
    percentOfRevenue: percent(safeValue(values, item.code), revenue),
  }));
}

export function calculateIndustryPnl(industry: ManagedAccountIndustry, values: PnlValueMap): CalculatedIndustryPnl {
  const template = getIndustryPnlTemplate(industry);

  const rawRevenueLines = template.revenueLines.map((item) => ({
    ...item,
    amount: round(safeValue(values, item.code)),
    percentOfRevenue: 0,
  }));
  const revenue = sum(rawRevenueLines);

  const revenueLines = rawRevenueLines.map((item) => ({
    ...item,
    percentOfRevenue: percent(item.amount, revenue),
  }));
  const directCostLines = calculateLines(template.directCostLines, values, revenue);
  const operatingExpenseLines = calculateLines(template.operatingExpenseLines, values, revenue);

  const directCost = sum(directCostLines);
  const grossProfit = round(revenue - directCost);

  const normalOperatingExpenseLines = operatingExpenseLines.filter(
    (item) => !["other_income", "finance_cost", "other_non_operating"].includes(item.group),
  );
  const operatingExpenses = sum(normalOperatingExpenseLines);
  const operatingProfit = round(grossProfit - operatingExpenses);

  const otherIncome = sum(operatingExpenseLines.filter((item) => item.group === "other_income"));
  const financeCost = sum(operatingExpenseLines.filter((item) => item.group === "finance_cost"));
  const otherNonOperating = sum(operatingExpenseLines.filter((item) => item.group === "other_non_operating"));
  const profitBeforeTax = round(operatingProfit + otherIncome - financeCost + otherNonOperating);

  const groupTotals = Object.fromEntries(ALL_GROUPS.map((group) => [group, 0])) as Record<MasterPnlGroup, number>;
  for (const item of [...revenueLines, ...directCostLines, ...operatingExpenseLines]) {
    groupTotals[item.group] = round(groupTotals[item.group] + item.amount);
  }

  return {
    industry,
    revenueLines,
    directCostLines,
    operatingExpenseLines,
    totals: {
      revenue,
      directCost,
      grossProfit,
      grossMarginPercent: percent(grossProfit, revenue),
      operatingExpenses,
      operatingProfit,
      operatingMarginPercent: percent(operatingProfit, revenue),
      otherIncome,
      financeCost,
      otherNonOperating,
      profitBeforeTax,
      profitBeforeTaxMarginPercent: percent(profitBeforeTax, revenue),
    },
    groupTotals,
    kpis: template.kpis,
  };
}

export function getPnlInputCodes(industry: ManagedAccountIndustry) {
  const template = getIndustryPnlTemplate(industry);
  return [...template.revenueLines, ...template.directCostLines, ...template.operatingExpenseLines];
}
