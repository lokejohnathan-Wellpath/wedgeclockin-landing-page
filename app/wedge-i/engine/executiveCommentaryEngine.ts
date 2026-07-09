import type { BusinessCalendarContext } from "./businessCalendarEngine";
import type { BusinessType, IndustryBenchmark } from "./benchmarks";
import type { ExecutiveForecast } from "./executiveForecastEngine";
import type { FinancialAnalysis } from "./financialAnalysisEngine";

export type ExecutiveCommentary = {
  executiveSummary: string;
  financialHighlights: string[];
  keyRisks: string[];
  growthOpportunities: string[];
  ceoObservation: string;
  managementConclusion: string;
};

export function generateExecutiveCommentary({
  companyName,
  businessType,
  financial,
  benchmark,
  forecast,
  calendar,
}: {
  companyName: string;
  businessType: BusinessType;
  financial: FinancialAnalysis;
  benchmark: IndustryBenchmark;
  forecast: ExecutiveForecast;
  calendar: BusinessCalendarContext;
}): ExecutiveCommentary {
  const businessLabel = companyName.trim() || "The business";

  return {
    executiveSummary: buildExecutiveSummary({
      businessLabel,
      businessType,
      financial,
      forecast,
      calendar,
    }),
    financialHighlights: buildFinancialHighlights(financial, benchmark),
    keyRisks: buildKeyRisks(financial, benchmark, calendar),
    growthOpportunities: buildGrowthOpportunities(businessType, financial, calendar),
    ceoObservation: buildCeoObservation({
      businessLabel,
      businessType,
      financial,
      forecast,
      calendar,
    }),
    managementConclusion: buildManagementConclusion(financial, forecast, calendar),
  };
}

function buildExecutiveSummary({
  businessLabel,
  businessType,
  financial,
  forecast,
  calendar,
}: {
  businessLabel: string;
  businessType: BusinessType;
  financial: FinancialAnalysis;
  forecast: ExecutiveForecast;
  calendar: BusinessCalendarContext;
}) {
  if (financial.operatingProfit <= 0) {
    return `${businessLabel} requires immediate management attention. The current operating position shows margin pressure, and management should prioritise cash protection, cost discipline and weekly revenue recovery during the ${calendar.rhythmName.toLowerCase()}.`;
  }

  if (financial.financialHealthScore >= 80 && financial.cashPositionScore >= 80) {
    return `${businessLabel} delivered a resilient operating position for a Malaysian ${businessType} business. Profitability, cash position and labour discipline support a controlled growth outlook, with forecast confidence at ${forecast.forecastConfidence}%.`;
  }

  return `${businessLabel} remains operationally stable, but management should continue monitoring margin quality, labour efficiency and cash runway. The next quarter should focus on disciplined execution rather than aggressive expansion.`;
}

function buildFinancialHighlights(
  financial: FinancialAnalysis,
  benchmark: IndustryBenchmark,
) {
  const highlights: string[] = [];

  if (financial.operatingProfit > 0) {
    highlights.push("Operating profit remains positive, supporting normal business continuity.");
  } else {
    highlights.push("Operating profit is negative and requires immediate margin recovery.");
  }

  if (financial.profitMargin >= benchmark.healthyMargin) {
    highlights.push("Profit margin is within the healthy benchmark range for this industry.");
  } else {
    highlights.push("Profit margin remains below benchmark and should be reviewed by product, service or campaign.");
  }

  if (
    financial.labourRatio >= benchmark.labourRatio.min &&
    financial.labourRatio <= benchmark.labourRatio.max
  ) {
    highlights.push("Labour ratio is within the recommended industry range.");
  } else if (financial.labourRatio > benchmark.labourRatio.max) {
    highlights.push("Labour ratio is above benchmark and may reduce operating leverage.");
  } else {
    highlights.push("Labour ratio is below benchmark; ensure service quality and capacity are not affected.");
  }

  if (financial.cashRunwayWeeks >= benchmark.cashRunwayWeeks.healthy) {
    highlights.push("Cash runway is healthy and supports near-term operational commitments.");
  } else {
    highlights.push("Cash runway should be monitored closely before new spending commitments.");
  }

  return highlights;
}

function buildKeyRisks(
  financial: FinancialAnalysis,
  benchmark: IndustryBenchmark,
  calendar: BusinessCalendarContext,
) {
  const risks: string[] = [];

  if (financial.operatingProfit <= 0) {
    risks.push("Margin recovery risk.");
  }

  if (financial.labourRatio > benchmark.labourRatio.max) {
    risks.push("Payroll pressure and roster inefficiency.");
  }

  if (financial.cashRunwayWeeks < benchmark.cashRunwayWeeks.watch) {
    risks.push("Short cash runway.");
  }

  if (financial.inventoryToRevenueRatio > benchmark.inventoryToRevenueLimit) {
    risks.push("Inventory tying up cash.");
  }

  if (calendar.isQuarterEndWindow) {
    risks.push("Quarter-end execution risk if revenue, margin and cash are not reviewed early.");
  }

  if (risks.length === 0) {
    risks.push("No immediate critical risk detected; management should continue monitoring margin, cash and labour discipline.");
  }

  return risks;
}

function buildGrowthOpportunities(
  businessType: BusinessType,
  financial: FinancialAnalysis,
  calendar: BusinessCalendarContext,
) {
  const opportunities: string[] = [];

  opportunities.push(calendar.commercialSignal);

  if (businessType === "F&B") {
    opportunities.push("Increase average receipt through family sets, drinks add-ons and high-margin menu bundles.");
    opportunities.push("Use daily sales rhythm to adjust manpower by peak and non-peak periods.");
  } else if (businessType === "Retail") {
    opportunities.push("Improve basket size through bundles, counter recommendations and slow-moving stock campaigns.");
    opportunities.push("Protect premium-margin products instead of discounting the entire store.");
  } else if (businessType === "Beauty / Aesthetic / Medical") {
    opportunities.push("Increase gross profit through treatment packages, prepaid programmes and product attachment.");
    opportunities.push("Use WhatsApp follow-up to improve client revisit and refill discipline.");
  } else if (businessType === "Manufacturing") {
    opportunities.push("Improve cash conversion through debtor collection before increasing raw material purchases.");
    opportunities.push("Review production schedule, supplier readiness and delivery cut-off before long weekends.");
  } else {
    opportunities.push("Increase revenue per staff through higher-value packages and better pricing discipline.");
    opportunities.push("Reduce low-margin work before adding headcount.");
  }

  if (financial.revenuePerStaff < 6000 && financial.revenuePerStaff > 0) {
    opportunities.push("Revenue per staff can improve through upsell, better scheduling or higher-value services.");
  }

  return opportunities;
}

function buildCeoObservation({
  businessLabel,
  businessType,
  financial,
  forecast,
  calendar,
}: {
  businessLabel: string;
  businessType: BusinessType;
  financial: FinancialAnalysis;
  forecast: ExecutiveForecast;
  calendar: BusinessCalendarContext;
}) {
  if (financial.operatingProfit <= 0) {
    return `${businessLabel} should not prioritise expansion yet. For the coming management period, the focus should remain on stabilising margin, protecting cash and improving weekly sales execution.`;
  }

  if (forecast.forecastConfidence >= 88) {
    return `${businessLabel} shows a credible growth profile for a Malaysian ${businessType} business. The current ${calendar.quarterName.toLowerCase()} supports controlled growth if payroll discipline and cash management are maintained.`;
  }

  return `${businessLabel} has a stable operating base, but the next quarter requires close management of labour, campaign conversion and cash position before further fixed-cost commitments.`;
}

function buildManagementConclusion(
  financial: FinancialAnalysis,
  forecast: ExecutiveForecast,
  calendar: BusinessCalendarContext,
) {
  if (financial.cashRunwayWeeks < 2) {
    return `Management should prioritise short-term cash preservation. New commitments should be deferred until weekly revenue and cash runway improve.`;
  }

  if (financial.operatingProfit > 0 && forecast.forecastConfidence >= 85) {
    return `Management outlook remains constructive. The business should continue disciplined execution, monitor the ${calendar.rhythmName.toLowerCase()}, and prepare the next weekly management agenda around margin, cash and growth opportunities.`;
  }

  return `Management should remain disciplined. The business is operationally stable, but improvement depends on consistent weekly execution, cash monitoring and industry-specific sales actions.`;
}