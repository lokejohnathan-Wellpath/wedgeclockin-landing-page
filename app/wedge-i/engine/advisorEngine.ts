import type {
  BusinessType,
  IndustryBenchmark,
} from "./benchmarks";
import type { BusinessCalendarContext } from "./businessCalendarEngine";
import type { ExecutiveForecast } from "./executiveForecastEngine";
import type { FinancialAnalysis } from "./financialAnalysisEngine";

import { getKnowledgeForBusinessType } from "./knowledge";
import { rankRecommendations } from "./recommendationRankingEngine";

export type AdvisorPriority = "Immediate" | "This Week" | "This Month";

export type AdvisorRecommendation = {
  priority: AdvisorPriority;
  area: string;
  title: string;
  recommendation: string;
  reason: string;
  score: number;
};

export type AdvisorReport = {
  primaryFocus: string;
  recommendations: AdvisorRecommendation[];
  operatingOpportunities: string[];
  managementWarnings: string[];
};

export function generateAdvisorReport({
  businessType,
  financial,
  benchmark,
  forecast,
  calendar,
}: {
  businessType: BusinessType;
  financial: FinancialAnalysis;
  benchmark: IndustryBenchmark;
  forecast: ExecutiveForecast;
  calendar: BusinessCalendarContext;
}): AdvisorReport {
  const knowledge = getKnowledgeForBusinessType(businessType);

  const rankedRecommendations = rankRecommendations({
    recommendations: knowledge,
    context: {
      businessType,
      financial,
      benchmark,
      calendar,
    },
    options: {
      limit: 8,
      includeGeneralIndustryOpportunities: true,
    },
  });

  const recommendations: AdvisorRecommendation[] =
    rankedRecommendations.map((item) => ({
      priority: convertPriority(item.priority),
      area: item.category,
      title: item.title,
      recommendation: item.action,
      reason: item.reason,
      score: item.score,
    }));

  const operatingOpportunities = rankedRecommendations
    .filter((item) =>
      ["Commercial", "Customer", "Growth", "Operations"].includes(
        item.category,
      ),
    )
    .map((item) => `${item.title}: ${item.action}`)
    .slice(0, 5);

  return {
    primaryFocus: buildPrimaryFocus({
      financial,
      benchmark,
      forecast,
    }),
    recommendations,
    operatingOpportunities,
    managementWarnings: buildManagementWarnings({
      financial,
      benchmark,
      calendar,
    }),
  };
}

function convertPriority(
  priority: "Immediate" | "Next 7 Days" | "Next 30 Days",
): AdvisorPriority {
  if (priority === "Immediate") return "Immediate";
  if (priority === "Next 7 Days") return "This Week";
  return "This Month";
}

function buildPrimaryFocus({
  financial,
  benchmark,
  forecast,
}: {
  financial: FinancialAnalysis;
  benchmark: IndustryBenchmark;
  forecast: ExecutiveForecast;
}) {
  if (financial.operatingProfit <= 0) {
    return "Restore positive operating profit and protect working cash before making new commitments.";
  }

  if (financial.cashRunwayWeeks < benchmark.cashRunwayWeeks.watch) {
    return "Strengthen cash runway and prioritise actions that generate near-term cash.";
  }

  if (financial.labourRatio > benchmark.labourRatio.max) {
    return "Improve labour productivity and align staffing cost with actual revenue demand.";
  }

  if (
    financial.inventoryToRevenueRatio >
    benchmark.inventoryToRevenueLimit
  ) {
    return "Release cash tied up in inventory before increasing purchasing commitments.";
  }

  if (
    financial.financialHealthScore >= 80 &&
    forecast.forecastConfidence >= 85
  ) {
    return "Pursue controlled growth while protecting margin, cash and operating discipline.";
  }

  return "Improve margin quality, cash discipline and weekly execution before expanding fixed costs.";
}

function buildManagementWarnings({
  financial,
  benchmark,
  calendar,
}: {
  financial: FinancialAnalysis;
  benchmark: IndustryBenchmark;
  calendar: BusinessCalendarContext;
}) {
  const warnings: string[] = [];

  if (financial.operatingProfit <= 0) {
    warnings.push(
      "Operating loss is reducing the business's financial flexibility.",
    );
  }

  if (financial.profitMargin < benchmark.healthyMargin) {
    warnings.push(
      "Operating margin remains below the healthy industry benchmark.",
    );
  }

  if (financial.cashRunwayWeeks < benchmark.cashRunwayWeeks.watch) {
    warnings.push(
      "Cash runway is below the recommended watch threshold.",
    );
  }

  if (financial.labourRatio > benchmark.labourRatio.max) {
    warnings.push(
      "Labour cost is above the recommended industry range.",
    );
  }

  if (
    financial.inventoryToRevenueRatio >
    benchmark.inventoryToRevenueLimit
  ) {
    warnings.push(
      "Inventory is tying up more working cash than recommended.",
    );
  }

  if (calendar.isMonthEndWindow) {
    warnings.push(
      "Month-end payroll, supplier payments and cash obligations should be reviewed.",
    );
  }

  if (calendar.isQuarterEndWindow) {
    warnings.push(
      "Quarter-end revenue, margin, inventory and cash figures should be confirmed before management reporting.",
    );
  }

  if (warnings.length === 0) {
    warnings.push(
      "No immediate critical warning detected; continue monitoring margin, cash and execution.",
    );
  }

  return warnings.slice(0, 5);
}