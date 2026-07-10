import type { KnowledgeRecommendation } from "./types";

export const serviceKnowledge: KnowledgeRecommendation[] = [
  {
    id: "SVC-001",
    industries: ["Service", "General SME"],
    category: "Commercial",
    priority: "Next 7 Days",
    baseWeight: 94,
    title: "Increase Service Value",
    action:
      "Create higher-value packages, improve pricing discipline and reduce low-margin custom work.",
    reason:
      "Service businesses grow more sustainably when value per transaction improves.",
    signals: ["GeneralIndustryOpportunity", "LowProfitMargin"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Medium",
      implementationCost: "Low",
      estimatedImplementationDays: 14,
      confidence: 90,
      kpi: "Average service value",
      ownerRole: "Business Owner",
    },
  },
  {
    id: "SVC-002",
    industries: ["Service", "General SME"],
    category: "Customer",
    priority: "Next 30 Days",
    baseWeight: 87,
    title: "Strengthen Repeat Business",
    action:
      "Track repeat customers, referral conversion and inactive-client follow-up.",
    reason:
      "Repeat business generally costs less to generate than new customer acquisition.",
    signals: ["PositiveOperatingProfit", "GeneralIndustryOpportunity"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Low",
      implementationCost: "Low",
      estimatedImplementationDays: 21,
      confidence: 87,
      kpi: "Repeat customer rate",
      ownerRole: "Sales Manager",
    },
  },
  {
    id: "SVC-003",
    industries: ["Service", "General SME"],
    category: "Labour",
    priority: "Immediate",
    baseWeight: 98,
    title: "Improve Revenue per Staff",
    action:
      "Review employee utilisation, billable work, scheduling and revenue contribution before adding headcount.",
    reason:
      "Payroll growth should be supported by measurable revenue productivity.",
    signals: ["HighLabourRatio", "LowRevenuePerStaff"],
    metadata: {
      expectedImpact: "Critical",
      implementationEffort: "Medium",
      implementationCost: "Low",
      estimatedImplementationDays: 14,
      confidence: 94,
      kpi: "Revenue per staff",
      ownerRole: "Operations Manager",
    },
  },
  {
    id: "SVC-004",
    industries: ["Service", "General SME"],
    category: "Cashflow",
    priority: "Immediate",
    baseWeight: 99,
    title: "Protect Working Cash",
    action:
      "Improve billing discipline, request deposits where suitable and follow up overdue customer payments.",
    reason:
      "Service businesses can report revenue while still facing cash shortages from delayed collection.",
    signals: ["ShortCashRunway"],
    metadata: {
      expectedImpact: "Critical",
      implementationEffort: "Low",
      implementationCost: "Low",
      estimatedImplementationDays: 7,
      confidence: 95,
      kpi: "Collection days",
      ownerRole: "Finance / Administration",
    },
  },
  {
    id: "SVC-005",
    industries: ["Service", "General SME"],
    category: "Growth",
    priority: "Next 30 Days",
    baseWeight: 85,
    title: "Pursue Controlled Growth",
    action:
      "Expand only through services with clear demand, healthy margin and manageable delivery capacity.",
    reason:
      "Growth should strengthen profit and cashflow instead of creating unmanaged workload.",
    signals: ["ControlledGrowthReady", "HealthyCashPosition"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Medium",
      implementationCost: "Medium",
      estimatedImplementationDays: 30,
      confidence: 86,
      kpi: "Contribution margin by service",
      ownerRole: "Managing Director",
    },
  },
  {
    id: "SVC-006",
    industries: ["Service", "General SME"],
    category: "Calendar",
    priority: "Next 7 Days",
    baseWeight: 84,
    title: "Confirm Holiday Scheduling",
    action:
      "Confirm staff availability, appointments, customer deadlines and follow-up activity before long weekends.",
    reason:
      "Holiday periods may reduce capacity or create service backlogs.",
    signals: ["LongWeekendPlanning"],
    metadata: {
      expectedImpact: "Medium",
      implementationEffort: "Low",
      implementationCost: "Low",
      estimatedImplementationDays: 5,
      confidence: 83,
      kpi: "On-time service completion",
      ownerRole: "Operations Manager",
    },
  },
];