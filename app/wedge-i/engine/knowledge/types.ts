import type { BusinessCalendarContext } from "../businessCalendarEngine";
import type { BusinessType, IndustryBenchmark } from "../benchmarks";
import type { FinancialAnalysis } from "../financialAnalysisEngine";

export type RecommendationPriority =
  | "Immediate"
  | "Next 7 Days"
  | "Next 30 Days";

export type RecommendationCategory =
  | "Financial"
  | "Cashflow"
  | "Labour"
  | "Inventory"
  | "Commercial"
  | "Operations"
  | "Customer"
  | "Calendar"
  | "Risk"
  | "Growth";

export type RecommendationSignal =
  | "OperatingLoss"
  | "LowProfitMargin"
  | "HealthyProfitMargin"
  | "HighLabourRatio"
  | "LowRevenuePerStaff"
  | "ShortCashRunway"
  | "HealthyCashPosition"
  | "HighInventoryPressure"
  | "HealthyInventoryPosition"
  | "PaydayWindow"
  | "MonthEndWindow"
  | "QuarterEndWindow"
  | "LongWeekendPlanning"
  | "PositiveOperatingProfit"
  | "ControlledGrowthReady"
  | "GeneralIndustryOpportunity";

export type RecommendationImpact = "Low" | "Medium" | "High" | "Critical";
export type RecommendationEffort = "Low" | "Medium" | "High";
export type RecommendationCost = "Low" | "Medium" | "High";

export type RecommendationContext = {
  businessType: BusinessType;
  financial: FinancialAnalysis;
  benchmark: IndustryBenchmark;
  calendar: BusinessCalendarContext;
};

export type RecommendationMetadata = {
  expectedImpact?: RecommendationImpact;
  implementationEffort?: RecommendationEffort;
  implementationCost?: RecommendationCost;
  estimatedImplementationDays?: number;
  confidence?: number;
  kpi?: string;
  ownerRole?: string;
};

export type KnowledgeRecommendation = {
  id: string;
  industries: BusinessType[];
  category: RecommendationCategory;
  priority: RecommendationPriority;
  baseWeight: number;
  title: string;
  action: string;
  reason: string;
  signals: RecommendationSignal[];
  metadata?: RecommendationMetadata;
  appliesWhen?: (context: RecommendationContext) => boolean;
  scoreAdjustment?: (context: RecommendationContext) => number;
};

export type RankedRecommendation = KnowledgeRecommendation & {
  score: number;
  matchedSignals: RecommendationSignal[];
};