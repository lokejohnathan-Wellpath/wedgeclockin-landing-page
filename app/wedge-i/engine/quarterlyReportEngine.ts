import type { AdvisorReport } from "./advisorEngine";
import type { BusinessCalendarContext } from "./businessCalendarEngine";
import type { ExecutiveCommentary } from "./executiveCommentaryEngine";
import type {
  ExecutiveForecast,
  ForecastScenario,
} from "./executiveForecastEngine";
import type { ExecutiveReportContext } from "./executiveReportContext";
import type { FinancialAnalysis } from "./financialAnalysisEngine";
import type {
  MeetingAgenda,
  MeetingAgendaItem,
} from "./meetingAgendaEngine";

export type QuarterlyReportStatus =
  | "Strong"
  | "Healthy"
  | "Stable"
  | "Watch Closely"
  | "Critical";

export type QuarterlyReportTrend =
  | "Improving"
  | "Stable"
  | "Declining"
  | "Insufficient Data";

export type QuarterlyReportPage = 1 | 2;

export type ReportSectionKey =
  | "cover"
  | "business-health"
  | "executive-summary"
  | "financial-highlights"
  | "management-outlook"
  | "management-commentary"
  | "business-risks"
  | "executive-advisor"
  | "malaysia-business-rhythm"
  | "meeting-agenda"
  | "report-information";

export type QuarterlyReportSection = {
  key: ReportSectionKey;
  page: QuarterlyReportPage;
  order: number;
  title: string;
  subtitle?: string;
};

export type BusinessHealthSummary = {
  score: number;
  status: QuarterlyReportStatus;
  trend: QuarterlyReportTrend;
  confidence: number;
  benchmarkPosition: string;
  commentary: string;
};

export type FinancialMetric = {
  key:
    | "revenue"
    | "operating-cost"
    | "operating-profit"
    | "profit-margin"
    | "payroll"
    | "labour-ratio"
    | "revenue-per-staff"
    | "cash-runway"
    | "inventory-ratio";
  label: string;
  value: number;
  formattedValue: string;
  unit: "RM" | "%" | "weeks" | "ratio";
  status: QuarterlyReportStatus;
  commentary: string;
};

export type FinancialHighlights = {
  metrics: FinancialMetric[];
  headline: string;
  highlights: string[];
};

export type QuarterlyOutlookItem = {
  key: "current-quarter" | "next-quarter" | "following-quarter";
  label: string;
  period: string;
  revenue: number;
  operatingProfit: number;
  cashPosition: number;
  growthRate: number;
  status: string;
  commentary: string;
};

export type QuarterlyOutlook = {
  forecastConfidence: number;
  trend: QuarterlyReportTrend;
  summary: string;
  periods: QuarterlyOutlookItem[];
};

export type ManagementCommentarySection = {
  executiveSummary: string;
  financialHighlights: string[];
  growthOpportunities: string[];
  keyRisks: string[];
  ceoObservation: string;
  managementConclusion: string;
};

export type ReportAdvisorRecommendation = {
  priority: string;
  category: string;
  title: string;
  action: string;
  reason: string;
  score: number;
};

export type ExecutiveAdvisorSection = {
  primaryFocus: string;
  recommendations: ReportAdvisorRecommendation[];
  operatingOpportunities: string[];
  managementWarnings: string[];
};

export type BusinessRisk = {
  id: string;
  area: string;
  severity: QuarterlyReportStatus;
  description: string;
  managementResponse: string;
};

export type MalaysiaBusinessRhythmSection = {
  rhythmName: string;
  quarterName: string;
  monthName: string;
  commercialSignal: string;
  operationalSignal: string;
  longWeekendSignal: string;
  managementFocus: string;
  isPaydayWindow: boolean;
  isMonthEndWindow: boolean;
  isQuarterEndWindow: boolean;
};

export type ReportMeetingAgendaItem = {
  order: number;
  section: string;
  title: string;
  discussionPoint: string;
  requiredAction: string;
  owner: string;
  priority: string;
  suggestedMinutes: number;
};

export type MeetingAgendaSection = {
  meetingTitle: string;
  meetingPurpose: string;
  reportingPeriod: string;
  estimatedDurationMinutes: number;
  primaryDecision: string;
  openingBrief: string;
  agendaItems: ReportMeetingAgendaItem[];
  decisionsRequired: string[];
  followUpActions: string[];
  closingNote: string;
};

export type QuarterlyChartPoint = {
  label: string;
  value: number;
};

export type QuarterlyChartSeries = {
  key:
    | "revenue"
    | "operating-profit"
    | "cash-position"
    | "business-health";
  title: string;
  unit: "RM" | "score";
  points: QuarterlyChartPoint[];
};

export type QuarterlyReportChartData = {
  series: QuarterlyChartSeries[];
};

export type QuarterlyReportPreparedInformation = {
  generatedAtIso: string;
  generatedDate: string;
  reportingPeriod: string;
  companyName: string;
  businessType: string;
  country: "MY";
  engineName: "Wedge-CEO";
  reportVersion: "1.0";
  forecastConfidence: number;
};

export type QuarterlyReport = {
  reportId: string;
  title: string;
  subtitle: string;
  companyName: string;
  businessType: string;
  reportingPeriod: string;
  preparedDate: string;
  pageCount: 2;

  sections: QuarterlyReportSection[];

  businessHealth: BusinessHealthSummary;
  executiveSummary: string;
  financialHighlights: FinancialHighlights;
  quarterlyOutlook: QuarterlyOutlook;
  managementCommentary: ManagementCommentarySection;
  executiveAdvisor: ExecutiveAdvisorSection;
  businessRisks: BusinessRisk[];
  malaysiaBusinessRhythm: MalaysiaBusinessRhythmSection;
  meetingAgenda: MeetingAgendaSection;
  chartData: QuarterlyReportChartData;
  preparedInformation: QuarterlyReportPreparedInformation;
};

export function generateQuarterlyReport(
  context: ExecutiveReportContext,
): QuarterlyReport {
  const companyName =
    context.companyName.trim() || "Unnamed Malaysian SME";

  const preparedDate = formatDate(context.generatedAt);

  const businessHealth = buildBusinessHealthSummary({
    financial: context.financial,
    forecast: context.forecast,
  });

  const financialHighlights = buildFinancialHighlights(
    context.financial,
  );

  const quarterlyOutlook = buildQuarterlyOutlook(
    context.forecast,
  );

  const managementCommentary =
    buildManagementCommentary(context.commentary);

  const executiveAdvisor = buildExecutiveAdvisor(
    context.advisor,
  );

  const businessRisks = buildBusinessRisks({
    financial: context.financial,
    advisor: context.advisor,
    calendar: context.calendar,
  });

  const malaysiaBusinessRhythm =
    buildMalaysiaBusinessRhythm(context.calendar);

  const meetingAgenda = buildMeetingAgenda(
    context.meetingAgenda,
  );

  const chartData = buildChartData({
    financial: context.financial,
    forecast: context.forecast,
    businessHealth,
  });

  const reportingPeriod = context.calendar.quarterName;

  return {
    reportId: createReportId({
      companyName,
      generatedAt: context.generatedAt,
    }),

    title: "Wedge-CEO Quarterly Executive Report",

    subtitle:
      "A simplified two-page management review of financial performance, outlook, risks and meeting priorities.",

    companyName,
    businessType: context.businessType,
    reportingPeriod,
    preparedDate,
    pageCount: 2,

    sections: buildReportSections(),

    businessHealth,
    executiveSummary: context.commentary.executiveSummary,
    financialHighlights,
    quarterlyOutlook,
    managementCommentary,
    executiveAdvisor,
    businessRisks,
    malaysiaBusinessRhythm,
    meetingAgenda,
    chartData,

    preparedInformation: {
      generatedAtIso: context.generatedAt.toISOString(),
      generatedDate: preparedDate,
      reportingPeriod,
      companyName,
      businessType: context.businessType,
      country: "MY",
      engineName: "Wedge-CEO",
      reportVersion: "1.0",
      forecastConfidence: context.forecast.forecastConfidence,
    },
  };
}

function buildReportSections(): QuarterlyReportSection[] {
  return [
    {
      key: "cover",
      page: 1,
      order: 1,
      title: "Quarterly Executive Report",
      subtitle: "Prepared by Wedge-CEO",
    },
    {
      key: "business-health",
      page: 1,
      order: 2,
      title: "Business Health",
    },
    {
      key: "executive-summary",
      page: 1,
      order: 3,
      title: "Executive Summary",
    },
    {
      key: "financial-highlights",
      page: 1,
      order: 4,
      title: "Financial Highlights",
    },
    {
      key: "management-outlook",
      page: 1,
      order: 5,
      title: "Management Outlook",
    },
    {
      key: "management-commentary",
      page: 2,
      order: 6,
      title: "Management Commentary",
    },
    {
      key: "business-risks",
      page: 2,
      order: 7,
      title: "Business Risks",
    },
    {
      key: "executive-advisor",
      page: 2,
      order: 8,
      title: "Executive Advisor",
    },
    {
      key: "malaysia-business-rhythm",
      page: 2,
      order: 9,
      title: "Malaysia Business Rhythm",
    },
    {
      key: "meeting-agenda",
      page: 2,
      order: 10,
      title: "Next Meeting Agenda",
    },
    {
      key: "report-information",
      page: 2,
      order: 11,
      title: "Report Information",
    },
  ];
}

function buildBusinessHealthSummary({
  financial,
  forecast,
}: {
  financial: FinancialAnalysis;
  forecast: ExecutiveForecast;
}): BusinessHealthSummary {
  const score = calculateBusinessHealthScore(financial);
  const status = getStatusFromScore(score);
  const trend = determineBusinessTrend(financial, forecast);

  return {
    score,
    status,
    trend,
    confidence: forecast.forecastConfidence,
    benchmarkPosition: buildBenchmarkPosition(score),
    commentary: buildBusinessHealthCommentary({
      score,
      financial,
      forecast,
    }),
  };
}

function calculateBusinessHealthScore(
  financial: FinancialAnalysis,
) {
  const weightedScore =
    financial.financialHealthScore * 0.3 +
    financial.cashPositionScore * 0.25 +
    financial.labourEfficiencyScore * 0.2 +
    financial.inventoryDisciplineScore * 0.1 +
    financial.growthMomentumScore * 0.15;

  return clampScore(weightedScore);
}

function determineBusinessTrend(
  financial: FinancialAnalysis,
  forecast: ExecutiveForecast,
): QuarterlyReportTrend {
  if (financial.monthlyRevenue <= 0) {
    return "Insufficient Data";
  }

  const currentRevenue = forecast.q1.revenue;
  const futureRevenue = forecast.q3.revenue;
  const currentProfit = forecast.q1.operatingProfit;
  const futureProfit = forecast.q3.operatingProfit;

  if (
    futureRevenue > currentRevenue &&
    futureProfit > currentProfit
  ) {
    return "Improving";
  }

  if (
    futureRevenue < currentRevenue ||
    futureProfit < currentProfit
  ) {
    return "Declining";
  }

  return "Stable";
}

function buildBenchmarkPosition(score: number) {
  if (score >= 85) {
    return "Above healthy Malaysian SME benchmark";
  }

  if (score >= 70) {
    return "Within healthy Malaysian SME benchmark";
  }

  if (score >= 50) {
    return "Below target but recoverable";
  }

  return "Immediate management attention required";
}

function buildBusinessHealthCommentary({
  score,
  financial,
  forecast,
}: {
  score: number;
  financial: FinancialAnalysis;
  forecast: ExecutiveForecast;
}) {
  if (financial.operatingProfit <= 0) {
    return "Business health is constrained by negative operating profit. Management should prioritise margin recovery and cash protection before taking on further commitments.";
  }

  if (score >= 85 && forecast.forecastConfidence >= 85) {
    return "The business maintains a strong operating position, supported by positive profitability, cash strength and a credible quarterly outlook.";
  }

  if (score >= 70) {
    return "The business remains in a healthy operating range, although continued discipline over margin, labour and cash is required.";
  }

  if (score >= 50) {
    return "The business remains operational, but weaknesses in cash, margin, labour productivity or inventory require focused management action.";
  }

  return "The current business position requires immediate management intervention and close weekly monitoring.";
}

function buildFinancialHighlights(
  financial: FinancialAnalysis,
): FinancialHighlights {
  const metrics: FinancialMetric[] = [
    {
      key: "revenue",
      label: "Monthly Revenue",
      value: financial.monthlyRevenue,
      formattedValue: formatRM(financial.monthlyRevenue),
      unit: "RM",
      status:
        financial.monthlyRevenue > 0 ? "Stable" : "Critical",
      commentary:
        financial.monthlyRevenue > 0
          ? "Revenue has been recorded for the current operating period."
          : "Revenue input is unavailable or zero.",
    },
    {
      key: "operating-cost",
      label: "Operating Cost",
      value: financial.operatingCost,
      formattedValue: formatRM(financial.operatingCost),
      unit: "RM",
      status:
        financial.operatingCost <= financial.monthlyRevenue
          ? "Healthy"
          : "Critical",
      commentary:
        financial.operatingCost <= financial.monthlyRevenue
          ? "Operating cost remains covered by current revenue."
          : "Operating cost exceeds current revenue.",
    },
    {
      key: "operating-profit",
      label: "Operating Profit",
      value: financial.operatingProfit,
      formattedValue: formatRM(financial.operatingProfit),
      unit: "RM",
      status:
        financial.operatingProfit > 0 ? "Healthy" : "Critical",
      commentary:
        financial.operatingProfit > 0
          ? "The business remains operating-profit positive."
          : "The business is currently operating at a loss.",
    },
    {
      key: "profit-margin",
      label: "Operating Margin",
      value: financial.profitMargin,
      formattedValue: formatPercent(financial.profitMargin),
      unit: "%",
      status: getStatusFromScore(
        financial.financialHealthScore,
      ),
      commentary:
        "Operating margin reflects the proportion of revenue remaining after current operating expenses and payroll.",
    },
    {
      key: "payroll",
      label: "Monthly Payroll",
      value: financial.monthlyPayroll,
      formattedValue: formatRM(financial.monthlyPayroll),
      unit: "RM",
      status: getStatusFromScore(
        financial.labourEfficiencyScore,
      ),
      commentary:
        "Payroll should remain aligned with revenue demand and productivity.",
    },
    {
      key: "labour-ratio",
      label: "Labour Ratio",
      value: financial.labourRatio,
      formattedValue: formatPercent(financial.labourRatio),
      unit: "%",
      status: getStatusFromScore(
        financial.labourEfficiencyScore,
      ),
      commentary:
        "Labour ratio measures payroll cost as a percentage of monthly revenue.",
    },
    {
      key: "revenue-per-staff",
      label: "Revenue per Staff",
      value: financial.revenuePerStaff,
      formattedValue: formatRM(financial.revenuePerStaff),
      unit: "RM",
      status: getStatusFromScore(
        financial.growthMomentumScore,
      ),
      commentary:
        "Revenue per staff provides a simplified view of workforce productivity.",
    },
    {
      key: "cash-runway",
      label: "Cash Runway",
      value: financial.cashRunwayWeeks,
      formattedValue: `${financial.cashRunwayWeeks.toFixed(1)} weeks`,
      unit: "weeks",
      status: getStatusFromScore(
        financial.cashPositionScore,
      ),
      commentary:
        "Cash runway estimates how long current cash can cover the present operating-cost level.",
    },
    {
      key: "inventory-ratio",
      label: "Inventory-to-Revenue Ratio",
      value: financial.inventoryToRevenueRatio,
      formattedValue: financial.inventoryToRevenueRatio.toFixed(2),
      unit: "ratio",
      status: getStatusFromScore(
        financial.inventoryDisciplineScore,
      ),
      commentary:
        "This ratio indicates the amount of working cash currently represented by inventory.",
    },
  ];

  return {
    metrics,
    headline: buildFinancialHeadline(financial),
    highlights: financial.overallSignals,
  };
}

function buildFinancialHeadline(
  financial: FinancialAnalysis,
) {
  if (financial.operatingProfit <= 0) {
    return "Financial performance requires immediate margin recovery and cash protection.";
  }

  if (
    financial.financialHealthScore >= 80 &&
    financial.cashPositionScore >= 80
  ) {
    return "Financial performance remains healthy, supported by positive operating profit and cash strength.";
  }

  if (financial.cashPositionScore < 60) {
    return "Profitability remains positive, but the cash position requires closer management.";
  }

  if (financial.labourEfficiencyScore < 60) {
    return "Operating profit remains positive, although labour pressure is reducing efficiency.";
  }

  return "Financial performance remains stable with opportunities to strengthen margin and operating discipline.";
}

function buildQuarterlyOutlook(
  forecast: ExecutiveForecast,
): QuarterlyOutlook {
  const periods: QuarterlyOutlookItem[] = [
    mapForecastScenario(
      forecast.q1,
      "current-quarter",
    ),
    mapForecastScenario(
      forecast.q2,
      "next-quarter",
    ),
    mapForecastScenario(
      forecast.q3,
      "following-quarter",
    ),
  ];

  const trend = determineForecastTrend(periods);

  return {
    forecastConfidence: forecast.forecastConfidence,
    trend,
    summary: forecast.forecastSummary,
    periods,
  };
}

function mapForecastScenario(
  scenario: ForecastScenario,
  key: QuarterlyOutlookItem["key"],
): QuarterlyOutlookItem {
  return {
    key,
    label: scenario.label,
    period: scenario.period,
    revenue: scenario.revenue,
    operatingProfit: scenario.operatingProfit,
    cashPosition: scenario.cashPosition,
    growthRate: scenario.growthRate,
    status: scenario.status,
    commentary: scenario.commentary,
  };
}

function determineForecastTrend(
  periods: QuarterlyOutlookItem[],
): QuarterlyReportTrend {
  const first = periods[0];
  const last = periods[periods.length - 1];

  if (!first || !last || first.revenue === 0) {
    return "Insufficient Data";
  }

  if (
    last.revenue > first.revenue &&
    last.operatingProfit > first.operatingProfit
  ) {
    return "Improving";
  }

  if (
    last.revenue < first.revenue ||
    last.operatingProfit < first.operatingProfit
  ) {
    return "Declining";
  }

  return "Stable";
}

function buildManagementCommentary(
  commentary: ExecutiveCommentary,
): ManagementCommentarySection {
  return {
    executiveSummary: commentary.executiveSummary,
    financialHighlights: commentary.financialHighlights,
    growthOpportunities: commentary.growthOpportunities,
    keyRisks: commentary.keyRisks,
    ceoObservation: commentary.ceoObservation,
    managementConclusion:
      commentary.managementConclusion,
  };
}

function buildExecutiveAdvisor(
  advisor: AdvisorReport,
): ExecutiveAdvisorSection {
  return {
    primaryFocus: advisor.primaryFocus,

    recommendations: advisor.recommendations.map(
      (recommendation) => ({
        priority: recommendation.priority,
        category: recommendation.area,
        title: recommendation.title,
        action: recommendation.recommendation,
        reason: recommendation.reason,
        score: recommendation.score,
      }),
    ),

    operatingOpportunities:
      advisor.operatingOpportunities,

    managementWarnings: advisor.managementWarnings,
  };
}

function buildBusinessRisks({
  financial,
  advisor,
  calendar,
}: {
  financial: FinancialAnalysis;
  advisor: AdvisorReport;
  calendar: BusinessCalendarContext;
}): BusinessRisk[] {
  const risks: BusinessRisk[] = [];

  if (financial.operatingProfit <= 0) {
    risks.push({
      id: "RISK-OPERATING-LOSS",
      area: "Financial",
      severity: "Critical",
      description:
        "Current operating cost exceeds monthly revenue.",
      managementResponse:
        "Approve immediate margin-recovery and cash-protection actions.",
    });
  }

  if (financial.cashPositionScore < 60) {
    risks.push({
      id: "RISK-CASH-RUNWAY",
      area: "Cashflow",
      severity:
        financial.cashPositionScore < 40
          ? "Critical"
          : "Watch Closely",
      description:
        "Current cash runway provides limited room for additional commitments.",
      managementResponse:
        "Defer non-essential spending and prioritise near-term cash generation.",
    });
  }

  if (financial.labourEfficiencyScore < 60) {
    risks.push({
      id: "RISK-LABOUR",
      area: "Labour",
      severity: "Watch Closely",
      description:
        "Labour cost or workforce productivity is outside the preferred operating range.",
      managementResponse:
        "Review roster, overtime, utilisation and revenue contribution before increasing headcount.",
    });
  }

  if (financial.inventoryDisciplineScore < 60) {
    risks.push({
      id: "RISK-INVENTORY",
      area: "Inventory",
      severity: "Watch Closely",
      description:
        "Inventory is tying up more working cash than recommended.",
      managementResponse:
        "Review purchasing, stock ageing and inventory movement before further commitments.",
    });
  }

  if (calendar.isMonthEndWindow) {
    risks.push({
      id: "RISK-MONTH-END",
      area: "Calendar",
      severity: "Stable",
      description:
        "Month-end payroll, supplier payments and cash obligations require confirmation.",
      managementResponse:
        "Complete the month-end cash and payment review before approving discretionary spending.",
    });
  }

  if (calendar.isQuarterEndWindow) {
    risks.push({
      id: "RISK-QUARTER-END",
      area: "Reporting",
      severity: "Stable",
      description:
        "Quarter-end figures may remain incomplete until revenue, margin, inventory and cash are confirmed.",
      managementResponse:
        "Complete management reporting before finalising quarter-end decisions.",
    });
  }

  advisor.managementWarnings.forEach(
    (warning, index) => {
      risks.push({
        id: `RISK-ADVISOR-${index + 1}`,
        area: "Management",
        severity: "Watch Closely",
        description: warning,
        managementResponse:
          "Review the related advisor recommendation and assign a responsible owner.",
      });
    },
  );

  const uniqueRisks = risks.filter(
    (risk, index, list) =>
      list.findIndex(
        (candidate) =>
          candidate.description === risk.description,
      ) === index,
  );

  if (uniqueRisks.length === 0) {
    uniqueRisks.push({
      id: "RISK-MONITORING",
      area: "Management",
      severity: "Healthy",
      description:
        "No immediate critical business risk was detected from the supplied information.",
      managementResponse:
        "Continue monitoring margin, cash, labour productivity and operating execution.",
    });
  }

  return uniqueRisks.slice(0, 7);
}

function buildMalaysiaBusinessRhythm(
  calendar: BusinessCalendarContext,
): MalaysiaBusinessRhythmSection {
  return {
    rhythmName: calendar.rhythmName,
    quarterName: calendar.quarterName,
    monthName: calendar.monthName,
    commercialSignal: calendar.commercialSignal,
    operationalSignal: calendar.operationalSignal,
    longWeekendSignal: calendar.longWeekendSignal,
    managementFocus: calendar.managementFocus,
    isPaydayWindow: calendar.isPaydayWindow,
    isMonthEndWindow: calendar.isMonthEndWindow,
    isQuarterEndWindow: calendar.isQuarterEndWindow,
  };
}

function buildMeetingAgenda(
  meetingAgenda: MeetingAgenda,
): MeetingAgendaSection {
  return {
    meetingTitle: meetingAgenda.meetingTitle,
    meetingPurpose: meetingAgenda.meetingPurpose,
    reportingPeriod: meetingAgenda.reportingPeriod,
    estimatedDurationMinutes:
      meetingAgenda.estimatedDurationMinutes,
    primaryDecision: meetingAgenda.primaryDecision,
    openingBrief: meetingAgenda.openingBrief,

    agendaItems: meetingAgenda.agendaItems.map(
      mapMeetingAgendaItem,
    ),

    decisionsRequired:
      meetingAgenda.decisionsRequired,

    followUpActions: meetingAgenda.followUpActions,
    closingNote: meetingAgenda.closingNote,
  };
}

function mapMeetingAgendaItem(
  item: MeetingAgendaItem,
): ReportMeetingAgendaItem {
  return {
    order: item.order,
    section: item.section,
    title: item.title,
    discussionPoint: item.discussionPoint,
    requiredAction: item.requiredAction,
    owner: item.owner,
    priority: item.priority,
    suggestedMinutes: item.suggestedMinutes,
  };
}

function buildChartData({
  financial,
  forecast,
  businessHealth,
}: {
  financial: FinancialAnalysis;
  forecast: ExecutiveForecast;
  businessHealth: BusinessHealthSummary;
}): QuarterlyReportChartData {
  return {
    series: [
      {
        key: "revenue",
        title: "Quarterly Revenue Outlook",
        unit: "RM",
        points: [
          {
            label: forecast.q1.label,
            value: forecast.q1.revenue,
          },
          {
            label: forecast.q2.label,
            value: forecast.q2.revenue,
          },
          {
            label: forecast.q3.label,
            value: forecast.q3.revenue,
          },
        ],
      },
      {
        key: "operating-profit",
        title: "Quarterly Operating Profit Outlook",
        unit: "RM",
        points: [
          {
            label: forecast.q1.label,
            value: forecast.q1.operatingProfit,
          },
          {
            label: forecast.q2.label,
            value: forecast.q2.operatingProfit,
          },
          {
            label: forecast.q3.label,
            value: forecast.q3.operatingProfit,
          },
        ],
      },
      {
        key: "cash-position",
        title: "Quarterly Cash Position Outlook",
        unit: "RM",
        points: [
          {
            label: forecast.q1.label,
            value: forecast.q1.cashPosition,
          },
          {
            label: forecast.q2.label,
            value: forecast.q2.cashPosition,
          },
          {
            label: forecast.q3.label,
            value: forecast.q3.cashPosition,
          },
        ],
      },
      {
        key: "business-health",
        title: "Executive Scorecard",
        unit: "score",
        points: [
          {
            label: "Business Health",
            value: businessHealth.score,
          },
          {
            label: "Financial Health",
            value: financial.financialHealthScore,
          },
          {
            label: "Cash Position",
            value: financial.cashPositionScore,
          },
          {
            label: "Labour Efficiency",
            value: financial.labourEfficiencyScore,
          },
          {
            label: "Inventory Discipline",
            value: financial.inventoryDisciplineScore,
          },
          {
            label: "Growth Momentum",
            value: financial.growthMomentumScore,
          },
        ],
      },
    ],
  };
}

function createReportId({
  companyName,
  generatedAt,
}: {
  companyName: string;
  generatedAt: Date;
}) {
  const companyPart = companyName
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);

  const datePart = generatedAt
    .toISOString()
    .slice(0, 10)
    .replaceAll("-", "");

  return `WCEO-${companyPart || "BUSINESS"}-${datePart}`;
}

function getStatusFromScore(
  score: number,
): QuarterlyReportStatus {
  if (score >= 85) return "Strong";
  if (score >= 70) return "Healthy";
  if (score >= 55) return "Stable";
  if (score >= 40) return "Watch Closely";
  return "Critical";
}

function clampScore(score: number) {
  return Math.max(
    0,
    Math.min(100, Math.round(score)),
  );
}

function formatRM(value: number) {
  const rounded = Math.round(value);

  if (rounded < 0) {
    return `-RM ${Math.abs(rounded).toLocaleString("en-MY")}`;
  }

  return `RM ${rounded.toLocaleString("en-MY")}`;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}