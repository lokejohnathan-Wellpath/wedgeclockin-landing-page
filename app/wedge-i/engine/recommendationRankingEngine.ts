import type {
  KnowledgeRecommendation,
  RankedRecommendation,
  RecommendationContext,
  RecommendationPriority,
  RecommendationSignal,
} from "./knowledge/types";

export type RecommendationRankingOptions = {
  limit?: number;
  includeGeneralIndustryOpportunities?: boolean;
};

export function rankRecommendations({
  recommendations,
  context,
  options = {},
}: {
  recommendations: KnowledgeRecommendation[];
  context: RecommendationContext;
  options?: RecommendationRankingOptions;
}): RankedRecommendation[] {
  const {
    limit = 8,
    includeGeneralIndustryOpportunities = true,
  } = options;

  const activeSignals = buildActiveSignals(context);

  return recommendations
    .filter((recommendation) =>
      recommendation.industries.includes(context.businessType),
    )
    .filter((recommendation) => {
      if (
        !includeGeneralIndustryOpportunities &&
        recommendation.signals.includes("GeneralIndustryOpportunity")
      ) {
        return false;
      }

      return recommendation.appliesWhen
        ? recommendation.appliesWhen(context)
        : true;
    })
    .map((recommendation) => {
      const matchedSignals = recommendation.signals.filter((signal) =>
        activeSignals.includes(signal),
      );

      const score =
        recommendation.baseWeight +
        getPriorityWeight(recommendation.priority) +
        getSignalScore(matchedSignals) +
        getContextAdjustment(recommendation, context);

      return {
        ...recommendation,
        score: clampScore(score),
        matchedSignals,
      };
    })
    .filter((recommendation) => {
      const hasGeneralOpportunity = recommendation.signals.includes(
        "GeneralIndustryOpportunity",
      );

      return recommendation.matchedSignals.length > 0 || hasGeneralOpportunity;
    })
    .sort((first, second) => {
      if (second.score !== first.score) {
        return second.score - first.score;
      }

      return (
        getPriorityOrder(first.priority) -
        getPriorityOrder(second.priority)
      );
    })
    .filter(
      (recommendation, index, list) =>
        list.findIndex(
          (candidate) =>
            candidate.title === recommendation.title &&
            candidate.action === recommendation.action,
        ) === index,
    )
    .slice(0, limit);
}

export function buildActiveSignals(
  context: RecommendationContext,
): RecommendationSignal[] {
  const { financial, benchmark, calendar } = context;
  const signals: RecommendationSignal[] = [];

  if (financial.operatingProfit <= 0) {
    signals.push("OperatingLoss");
  } else {
    signals.push("PositiveOperatingProfit");
  }

  if (financial.profitMargin < benchmark.healthyMargin) {
    signals.push("LowProfitMargin");
  } else {
    signals.push("HealthyProfitMargin");
  }

  if (financial.labourRatio > benchmark.labourRatio.max) {
    signals.push("HighLabourRatio");
  }

  if (
    financial.revenuePerStaff > 0 &&
    financial.revenuePerStaff < benchmark.revenuePerStaffTarget
  ) {
    signals.push("LowRevenuePerStaff");
  }

  if (financial.cashRunwayWeeks < benchmark.cashRunwayWeeks.watch) {
    signals.push("ShortCashRunway");
  }

  if (financial.cashRunwayWeeks >= benchmark.cashRunwayWeeks.healthy) {
    signals.push("HealthyCashPosition");
  }

  if (
    financial.inventoryToRevenueRatio >
    benchmark.inventoryToRevenueLimit
  ) {
    signals.push("HighInventoryPressure");
  } else {
    signals.push("HealthyInventoryPosition");
  }

  if (calendar.isPaydayWindow) {
    signals.push("PaydayWindow");
  }

  if (calendar.isMonthEndWindow) {
    signals.push("MonthEndWindow");
  }

  if (calendar.isQuarterEndWindow) {
    signals.push("QuarterEndWindow");
  }

  signals.push("LongWeekendPlanning");
  signals.push("GeneralIndustryOpportunity");

  if (
    financial.operatingProfit > 0 &&
    financial.cashPositionScore >= 80 &&
    financial.financialHealthScore >= 80
  ) {
    signals.push("ControlledGrowthReady");
  }

  return signals;
}

function getPriorityWeight(priority: RecommendationPriority) {
  if (priority === "Immediate") return 15;
  if (priority === "Next 7 Days") return 10;
  return 5;
}

function getPriorityOrder(priority: RecommendationPriority) {
  if (priority === "Immediate") return 1;
  if (priority === "Next 7 Days") return 2;
  return 3;
}

function getSignalScore(signals: RecommendationSignal[]) {
  return signals.reduce((total, signal) => {
    if (signal === "OperatingLoss") return total + 22;
    if (signal === "ShortCashRunway") return total + 20;
    if (signal === "HighLabourRatio") return total + 16;
    if (signal === "HighInventoryPressure") return total + 14;
    if (signal === "LowProfitMargin") return total + 14;
    if (signal === "LowRevenuePerStaff") return total + 10;
    if (signal === "QuarterEndWindow") return total + 8;
    if (signal === "PaydayWindow") return total + 6;
    if (signal === "ControlledGrowthReady") return total + 8;
    if (signal === "HealthyCashPosition") return total + 4;
    if (signal === "HealthyProfitMargin") return total + 4;
    if (signal === "PositiveOperatingProfit") return total + 4;
    if (signal === "LongWeekendPlanning") return total + 3;
    if (signal === "GeneralIndustryOpportunity") return total + 2;

    return total;
  }, 0);
}

function getContextAdjustment(
  recommendation: KnowledgeRecommendation,
  context: RecommendationContext,
) {
  return recommendation.scoreAdjustment
    ? recommendation.scoreAdjustment(context)
    : 0;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(150, Math.round(score)));
}