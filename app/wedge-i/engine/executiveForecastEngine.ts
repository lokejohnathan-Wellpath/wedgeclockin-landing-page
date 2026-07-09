import type { BusinessCalendarContext } from "./businessCalendarEngine";
import type { IndustryBenchmark } from "./benchmarks";
import type { FinancialAnalysis } from "./financialAnalysisEngine";

export type ForecastScenario = {
  label: string;
  period: string;
  revenue: number;
  operatingProfit: number;
  cashPosition: number;
  growthRate: number;
  status: string;
  commentary: string;
};

export type ExecutiveForecast = {
  nextMonthRevenue: number;
  nextMonthProfit: number;
  q1: ForecastScenario;
  q2: ForecastScenario;
  q3: ForecastScenario;
  forecastConfidence: number;
  forecastSummary: string;
};

export function generateExecutiveForecast({
  financial,
  benchmark,
  calendar,
}: {
  financial: FinancialAnalysis;
  benchmark: IndustryBenchmark;
  calendar: BusinessCalendarContext;
}): ExecutiveForecast {
  const baseGrowth = benchmark.baseQuarterGrowth;
  const marginQualityFactor = getMarginQualityFactor(financial.profitMargin, benchmark.healthyMargin);
  const cashFactor = getCashFactor(financial.cashRunwayWeeks, benchmark.cashRunwayWeeks.healthy);
  const labourFactor = getLabourFactor(
    financial.labourRatio,
    benchmark.labourRatio.min,
    benchmark.labourRatio.max,
  );
  const inventoryFactor = getInventoryFactor(
    financial.inventoryToRevenueRatio,
    benchmark.inventoryToRevenueLimit,
  );
  const calendarFactor = getCalendarFactor(calendar);

  const monthlyGrowthRate = clampGrowth(
    baseGrowth / 3 + marginQualityFactor + cashFactor + labourFactor + inventoryFactor + calendarFactor,
  );

  const nextMonthRevenue = financial.monthlyRevenue * (1 + monthlyGrowthRate);
  const nextMonthProfit =
    financial.operatingProfit * (1 + monthlyGrowthRate + getProfitDisciplineFactor(financial));

  const q1Revenue = financial.monthlyRevenue * 3;
  const q1Profit = financial.operatingProfit * 3;

  const q2Growth = clampQuarterGrowth(baseGrowth + monthlyGrowthRate);
  const q2Revenue = q1Revenue * (1 + q2Growth);
  const q2Profit = q1Profit * (1 + q2Growth + 0.03);

  const q3Growth = clampQuarterGrowth(q2Growth + getMomentumAdjustment(financial));
  const q3Revenue = q2Revenue * (1 + q3Growth);
  const q3Profit = q2Profit * (1 + q3Growth + 0.02);

  const q1Cash = financial.cashRunwayWeeks > 0 ? financial.operatingCost * (financial.cashRunwayWeeks / 4) : 0;
  const q2Cash = q1Cash + q2Profit;
  const q3Cash = q2Cash + q3Profit;

  const forecastConfidence = calculateForecastConfidence(financial, calendar);

  return {
    nextMonthRevenue,
    nextMonthProfit,
    q1: {
      label: "Q1 Performance",
      period: calendar.quarterName,
      revenue: q1Revenue,
      operatingProfit: q1Profit,
      cashPosition: q1Cash,
      growthRate: 0,
      status: financial.operatingProfit >= 0 ? "On Track" : "Margin Recovery Required",
      commentary:
        financial.operatingProfit >= 0
          ? "Current quarter performance remains supported by positive operating profit and operating continuity."
          : "Current quarter requires margin recovery, cost control and focused sales execution.",
    },
    q2: {
      label: "Q2 Management Outlook",
      period: "Base Outlook",
      revenue: q2Revenue,
      operatingProfit: q2Profit,
      cashPosition: q2Cash,
      growthRate: Math.round(q2Growth * 100),
      status: q2Profit >= q1Profit ? "Improving" : "Watch Closely",
      commentary:
        "Management outlook assumes disciplined cost control, stable labour productivity and execution of weekly business priorities.",
    },
    q3: {
      label: "Q3 Growth Projection",
      period: "Growth Case",
      revenue: q3Revenue,
      operatingProfit: q3Profit,
      cashPosition: q3Cash,
      growthRate: Math.round(q3Growth * 100),
      status: q3Profit >= q2Profit ? "Growth Case" : "Controlled Recovery",
      commentary:
        "Projection assumes improved customer value, stable labour cost, controlled inventory and stronger campaign conversion.",
    },
    forecastConfidence,
    forecastSummary: buildForecastSummary(financial, forecastConfidence, calendar),
  };
}

function getMarginQualityFactor(profitMargin: number, healthyMargin: number) {
  if (profitMargin >= healthyMargin * 1.5) return 0.015;
  if (profitMargin >= healthyMargin) return 0.01;
  if (profitMargin > 0) return 0.003;
  return -0.015;
}

function getCashFactor(cashRunwayWeeks: number, healthyCashWeeks: number) {
  if (cashRunwayWeeks >= healthyCashWeeks * 2) return 0.01;
  if (cashRunwayWeeks >= healthyCashWeeks) return 0.005;
  if (cashRunwayWeeks > 0) return -0.005;
  return -0.015;
}

function getLabourFactor(labourRatio: number, idealMin: number, idealMax: number) {
  if (labourRatio >= idealMin && labourRatio <= idealMax) return 0.006;
  if (labourRatio > idealMax) return -0.008;
  if (labourRatio > 0 && labourRatio < idealMin) return 0.002;
  return -0.004;
}

function getInventoryFactor(inventoryToRevenueRatio: number, inventoryLimit: number) {
  if (inventoryToRevenueRatio === 0) return 0;
  if (inventoryToRevenueRatio <= inventoryLimit) return 0.004;
  return -0.007;
}

function getCalendarFactor(calendar: BusinessCalendarContext) {
  if (calendar.isPaydayWindow) return 0.004;
  if (calendar.isQuarterEndWindow) return -0.002;
  return 0;
}

function getProfitDisciplineFactor(financial: FinancialAnalysis) {
  if (financial.operatingProfit <= 0) return 0;
  if (financial.labourEfficiencyScore >= 80 && financial.inventoryDisciplineScore >= 70) {
    return 0.015;
  }
  return 0.005;
}

function getMomentumAdjustment(financial: FinancialAnalysis) {
  if (
    financial.financialHealthScore >= 80 &&
    financial.cashPositionScore >= 80 &&
    financial.labourEfficiencyScore >= 80
  ) {
    return 0.025;
  }

  if (financial.financialHealthScore < 50 || financial.cashPositionScore < 50) {
    return -0.015;
  }

  return 0.01;
}

function calculateForecastConfidence(
  financial: FinancialAnalysis,
  calendar: BusinessCalendarContext,
) {
  let score = 76;

  if (financial.monthlyRevenue > 0) score += 6;
  if (financial.operatingProfit > 0) score += 6;
  if (financial.cashPositionScore >= 80) score += 5;
  if (financial.labourEfficiencyScore >= 80) score += 4;
  if (financial.inventoryDisciplineScore >= 70) score += 3;
  if (calendar.isQuarterEndWindow) score -= 2;

  return Math.max(60, Math.min(96, Math.round(score)));
}

function buildForecastSummary(
  financial: FinancialAnalysis,
  forecastConfidence: number,
  calendar: BusinessCalendarContext,
) {
  if (financial.operatingProfit <= 0) {
    return `Forecast visibility is moderate at ${forecastConfidence}%. Management should prioritise margin recovery, cash protection and weekly revenue discipline during the ${calendar.rhythmName.toLowerCase()}.`;
  }

  if (financial.cashPositionScore >= 80 && financial.labourEfficiencyScore >= 80) {
    return `Forecast visibility is strong at ${forecastConfidence}%. Current operating profit, cash position and labour discipline support a controlled growth outlook during the ${calendar.rhythmName.toLowerCase()}.`;
  }

  return `Forecast visibility is ${forecastConfidence}%. Business performance is supported by positive operating profit, but management should continue monitoring cash position, labour efficiency and campaign execution.`;
}

function clampGrowth(value: number) {
  return Math.max(-0.03, Math.min(0.08, value));
}

function clampQuarterGrowth(value: number) {
  return Math.max(-0.08, Math.min(0.18, value));
}