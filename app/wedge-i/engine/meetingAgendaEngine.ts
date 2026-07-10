import type { AdvisorReport } from "./advisorEngine";
import type { BusinessCalendarContext } from "./businessCalendarEngine";
import type { ExecutiveForecast } from "./executiveForecastEngine";
import type { FinancialAnalysis } from "./financialAnalysisEngine";

export type MeetingAgendaPriority =
  | "Decision Required"
  | "Immediate Review"
  | "This Week"
  | "This Month"
  | "Information";

export type MeetingAgendaItem = {
  id: string;
  order: number;
  section: string;
  title: string;
  discussionPoint: string;
  requiredAction: string;
  owner: string;
  priority: MeetingAgendaPriority;
  suggestedMinutes: number;
};

export type MeetingAgenda = {
  meetingTitle: string;
  meetingPurpose: string;
  reportingPeriod: string;
  preparedDate: string;
  estimatedDurationMinutes: number;
  primaryDecision: string;
  openingBrief: string;
  agendaItems: MeetingAgendaItem[];
  decisionsRequired: string[];
  followUpActions: string[];
  closingNote: string;
};

export function generateMeetingAgenda({
  companyName,
  financial,
  forecast,
  calendar,
  advisor,
  preparedDate = new Date(),
}: {
  companyName: string;
  financial: FinancialAnalysis;
  forecast: ExecutiveForecast;
  calendar: BusinessCalendarContext;
  advisor: AdvisorReport;
  preparedDate?: Date;
}): MeetingAgenda {
  const businessLabel = companyName.trim() || "The business";

  const agendaItems = buildAgendaItems({
    financial,
    forecast,
    calendar,
    advisor,
  });

  const orderedAgendaItems = agendaItems
    .sort((first, second) => {
      const priorityDifference =
        getPriorityOrder(first.priority) -
        getPriorityOrder(second.priority);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return first.order - second.order;
    })
    .map((item, index) => ({
      ...item,
      order: index + 1,
    }));

  const estimatedDurationMinutes = orderedAgendaItems.reduce(
    (total, item) => total + item.suggestedMinutes,
    0,
  );

  return {
    meetingTitle: `${businessLabel} — Wedge-CEO Management Meeting`,
    meetingPurpose:
      "Review current business performance, confirm management priorities and assign actions for the next operating period.",
    reportingPeriod: calendar.quarterName,
    preparedDate: preparedDate.toLocaleDateString("en-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    estimatedDurationMinutes,
    primaryDecision: advisor.primaryFocus,
    openingBrief: buildOpeningBrief({
      businessLabel,
      financial,
      forecast,
      calendar,
    }),
    agendaItems: orderedAgendaItems,
    decisionsRequired: buildDecisionsRequired({
      advisor,
      financial,
      forecast,
    }),
    followUpActions: buildFollowUpActions(advisor),
    closingNote: buildClosingNote({
      financial,
      forecast,
      calendar,
    }),
  };
}

function buildAgendaItems({
  financial,
  forecast,
  calendar,
  advisor,
}: {
  financial: FinancialAnalysis;
  forecast: ExecutiveForecast;
  calendar: BusinessCalendarContext;
  advisor: AdvisorReport;
}): MeetingAgendaItem[] {
  const items: MeetingAgendaItem[] = [];

  items.push({
    id: "AGENDA-FINANCIAL-REVIEW",
    order: 1,
    section: "Financial Performance",
    title: "Revenue, cost and operating profit review",
    discussionPoint:
      `Review monthly revenue, operating cost, operating profit and margin. ` +
      `Current operating profit is ${formatRM(financial.operatingProfit)} with an operating margin of ${financial.profitMargin}%.`,
    requiredAction:
      financial.operatingProfit <= 0
        ? "Agree on immediate margin-recovery actions and identify costs that can be reduced without affecting essential operations."
        : "Confirm whether current profitability is sustainable and identify the strongest profit drivers.",
    owner: "Owner / Finance",
    priority:
      financial.operatingProfit <= 0
        ? "Decision Required"
        : "Immediate Review",
    suggestedMinutes: 8,
  });

  items.push({
    id: "AGENDA-CASH-POSITION",
    order: 2,
    section: "Cash Position",
    title: "Cash runway and near-term commitments",
    discussionPoint:
      `Review the current cash runway of ${financial.cashRunwayWeeks.toFixed(1)} weeks, ` +
      "including payroll, supplier payments and other near-term obligations.",
    requiredAction:
      financial.cashPositionScore < 60
        ? "Approve cash-protection actions and defer non-essential commitments."
        : "Confirm upcoming cash obligations and preserve sufficient operating buffer.",
    owner: "Owner / Finance",
    priority:
      financial.cashPositionScore < 60
        ? "Decision Required"
        : "Immediate Review",
    suggestedMinutes: 7,
  });

  items.push({
    id: "AGENDA-LABOUR",
    order: 3,
    section: "Labour and Productivity",
    title: "Labour ratio and revenue productivity",
    discussionPoint:
      `Review labour cost at ${financial.labourRatio}% of revenue and revenue per staff of ${formatRM(
        financial.revenuePerStaff,
      )}.`,
    requiredAction:
      financial.labourEfficiencyScore < 60
        ? "Agree on roster, overtime, capacity or productivity improvements before increasing headcount."
        : "Confirm that staffing remains aligned with revenue demand and service requirements.",
    owner: "Operations Manager",
    priority:
      financial.labourEfficiencyScore < 60
        ? "Immediate Review"
        : "Information",
    suggestedMinutes: 6,
  });

  items.push({
    id: "AGENDA-FORECAST",
    order: 4,
    section: "Management Outlook",
    title: "Quarterly forecast and growth assumptions",
    discussionPoint:
      `Review the Q2 and Q3 forecast, including projected revenue, operating profit and cash position. ` +
      `Current forecast confidence is ${forecast.forecastConfidence}%.`,
    requiredAction:
      "Confirm which assumptions management accepts, which risks may weaken the forecast and which actions must be completed before the next review.",
    owner: "Managing Director",
    priority:
      forecast.forecastConfidence < 75
        ? "Immediate Review"
        : "This Month",
    suggestedMinutes: 8,
  });

  items.push({
    id: "AGENDA-MALAYSIA-RHYTHM",
    order: 5,
    section: "Malaysia Business Rhythm",
    title: calendar.rhythmName,
    discussionPoint: calendar.managementFocus,
    requiredAction:
      "Confirm any stock, staffing, supplier, production, campaign or customer actions required for the current Malaysian trading period.",
    owner: "Operations / Commercial",
    priority:
      calendar.isMonthEndWindow || calendar.isQuarterEndWindow
        ? "Immediate Review"
        : "This Week",
    suggestedMinutes: 6,
  });

  advisor.recommendations.slice(0, 5).forEach((recommendation, index) => {
    items.push({
      id: `AGENDA-ADVISOR-${index + 1}`,
      order: 10 + index,
      section: recommendation.area,
      title: recommendation.title,
      discussionPoint: recommendation.reason,
      requiredAction: recommendation.recommendation,
      owner: inferOwner(recommendation.area),
      priority: convertAdvisorPriority(recommendation.priority),
      suggestedMinutes:
        recommendation.priority === "Immediate" ? 6 : 4,
    });
  });

  return removeDuplicateAgendaItems(items);
}

function buildDecisionsRequired({
  advisor,
  financial,
  forecast,
}: {
  advisor: AdvisorReport;
  financial: FinancialAnalysis;
  forecast: ExecutiveForecast;
}) {
  const decisions: string[] = [];

  if (financial.operatingProfit <= 0) {
    decisions.push(
      "Approve the immediate operating-margin recovery plan.",
    );
  }

  if (financial.cashPositionScore < 60) {
    decisions.push(
      "Approve cash-protection measures and defer non-essential spending.",
    );
  }

  if (financial.labourEfficiencyScore < 60) {
    decisions.push(
      "Approve labour-productivity, roster or overtime corrective actions.",
    );
  }

  if (forecast.forecastConfidence < 75) {
    decisions.push(
      "Review and revise the assumptions supporting the quarterly outlook.",
    );
  }

  advisor.recommendations
    .filter((item) => item.priority === "Immediate")
    .slice(0, 3)
    .forEach((item) => {
      decisions.push(`Approve action: ${item.title}.`);
    });

  if (decisions.length === 0) {
    decisions.push(
      "Confirm the top weekly management priority and assign a responsible owner.",
    );
  }

  return uniqueStrings(decisions).slice(0, 6);
}

function buildFollowUpActions(advisor: AdvisorReport) {
  const actions = advisor.recommendations
    .slice(0, 6)
    .map(
      (item) =>
        `${item.priority}: ${item.title} — ${item.recommendation}`,
    );

  if (actions.length === 0) {
    actions.push(
      "Review revenue, margin, cash and operational execution before the next meeting.",
    );
  }

  return uniqueStrings(actions);
}

function buildOpeningBrief({
  businessLabel,
  financial,
  forecast,
  calendar,
}: {
  businessLabel: string;
  financial: FinancialAnalysis;
  forecast: ExecutiveForecast;
  calendar: BusinessCalendarContext;
}) {
  if (financial.operatingProfit <= 0) {
    return `${businessLabel} enters this meeting with margin pressure and limited room for additional commitments. Management should prioritise cash protection, cost control and near-term revenue recovery during the ${calendar.rhythmName.toLowerCase()}.`;
  }

  if (
    financial.financialHealthScore >= 80 &&
    financial.cashPositionScore >= 80
  ) {
    return `${businessLabel} remains in a healthy operating position. Positive operating profit, cash strength and forecast confidence of ${forecast.forecastConfidence}% support controlled growth, provided management maintains discipline over labour, inventory and execution.`;
  }

  return `${businessLabel} remains operationally stable, but management should continue monitoring margin quality, cash runway, labour productivity and execution during the ${calendar.rhythmName.toLowerCase()}.`;
}

function buildClosingNote({
  financial,
  forecast,
  calendar,
}: {
  financial: FinancialAnalysis;
  forecast: ExecutiveForecast;
  calendar: BusinessCalendarContext;
}) {
  if (financial.operatingProfit <= 0) {
    return "The next review should confirm whether the agreed recovery actions have improved weekly revenue, margin and cash position.";
  }

  if (forecast.forecastConfidence >= 85) {
    return `Management outlook remains constructive. The next review should confirm progress against forecast assumptions and the priorities set for the ${calendar.quarterName.toLowerCase()}.`;
  }

  return "The next review should confirm progress on margin, cash, labour productivity and the agreed weekly management actions.";
}

function inferOwner(area: string) {
  if (area === "Financial" || area === "Cashflow") {
    return "Owner / Finance";
  }

  if (area === "Labour" || area === "Operations") {
    return "Operations Manager";
  }

  if (area === "Inventory") {
    return "Purchasing / Operations";
  }

  if (
    area === "Commercial" ||
    area === "Customer" ||
    area === "Growth"
  ) {
    return "Sales / Commercial";
  }

  if (area === "Calendar") {
    return "Operations / Commercial";
  }

  return "Management Team";
}

function convertAdvisorPriority(
  priority: "Immediate" | "This Week" | "This Month",
): MeetingAgendaPriority {
  if (priority === "Immediate") return "Decision Required";
  if (priority === "This Week") return "This Week";
  return "This Month";
}

function getPriorityOrder(priority: MeetingAgendaPriority) {
  if (priority === "Decision Required") return 1;
  if (priority === "Immediate Review") return 2;
  if (priority === "This Week") return 3;
  if (priority === "This Month") return 4;
  return 5;
}

function removeDuplicateAgendaItems(items: MeetingAgendaItem[]) {
  return items.filter(
    (item, index, list) =>
      list.findIndex(
        (candidate) =>
          candidate.title === item.title &&
          candidate.requiredAction === item.requiredAction,
      ) === index,
  );
}

function uniqueStrings(items: string[]) {
  return items.filter(
    (item, index, list) => list.indexOf(item) === index,
  );
}

function formatRM(value: number) {
  return `RM ${Math.round(value).toLocaleString("en-MY")}`;
}