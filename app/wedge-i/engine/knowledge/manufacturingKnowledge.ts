import type { KnowledgeRecommendation } from "./types";

export const manufacturingKnowledge: KnowledgeRecommendation[] = [
  {
    id: "MFG-001",
    industries: ["Manufacturing"],
    category: "Cashflow",
    priority: "Immediate",
    baseWeight: 100,
    title: "Accelerate Debtor Collection",
    action:
      "Prioritise invoices beyond agreed payment terms before increasing raw material or production commitments.",
    reason:
      "Manufacturing growth can consume working capital faster than revenue is collected.",
    signals: ["ShortCashRunway", "GeneralIndustryOpportunity"],
    metadata: {
      expectedImpact: "Critical",
      implementationEffort: "Medium",
      implementationCost: "Low",
      estimatedImplementationDays: 7,
      confidence: 95,
      kpi: "Debtor days",
      ownerRole: "Finance Manager",
    },
  },
  {
    id: "MFG-002",
    industries: ["Manufacturing"],
    category: "Inventory",
    priority: "Next 7 Days",
    baseWeight: 97,
    title: "Align Raw Materials with Confirmed Demand",
    action:
      "Match purchase orders with confirmed production schedules, customer orders and supplier lead times.",
    reason:
      "Excess raw material holding weakens working capital and increases stock exposure.",
    signals: ["HighInventoryPressure"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Medium",
      implementationCost: "Low",
      estimatedImplementationDays: 10,
      confidence: 93,
      kpi: "Raw material holding days",
      ownerRole: "Purchasing Manager",
    },
  },
  {
    id: "MFG-003",
    industries: ["Manufacturing"],
    category: "Operations",
    priority: "Next 7 Days",
    baseWeight: 93,
    title: "Reduce Production Downtime",
    action:
      "Review machine downtime, changeover delays and production bottlenecks against scheduled output.",
    reason:
      "Downtime reduces margin, delays delivery and increases labour cost per unit.",
    signals: ["GeneralIndustryOpportunity", "LowProfitMargin"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Medium",
      implementationCost: "Medium",
      estimatedImplementationDays: 14,
      confidence: 89,
      kpi: "Machine utilisation",
      ownerRole: "Production Manager",
    },
  },
  {
    id: "MFG-004",
    industries: ["Manufacturing"],
    category: "Calendar",
    priority: "Next 7 Days",
    baseWeight: 91,
    title: "Plan Production Before Long Weekends",
    action:
      "Confirm production cut-off, raw material delivery, staff availability and customer dispatch earlier when holidays fall near Friday or Monday.",
    reason:
      "Long weekends can reduce supplier availability, production capacity and transport reliability.",
    signals: ["LongWeekendPlanning"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Low",
      implementationCost: "Low",
      estimatedImplementationDays: 5,
      confidence: 92,
      kpi: "On-time delivery percentage",
      ownerRole: "Operations Manager",
    },
  },
  {
    id: "MFG-005",
    industries: ["Manufacturing"],
    category: "Labour",
    priority: "Immediate",
    baseWeight: 95,
    title: "Improve Labour Productivity",
    action:
      "Compare output per shift and overtime cost before increasing headcount or extending production hours.",
    reason:
      "Higher labour spending should produce measurable improvements in output.",
    signals: ["HighLabourRatio", "LowRevenuePerStaff"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Medium",
      implementationCost: "Low",
      estimatedImplementationDays: 14,
      confidence: 91,
      kpi: "Output per labour hour",
      ownerRole: "Production Manager",
    },
  },
  {
    id: "MFG-006",
    industries: ["Manufacturing"],
    category: "Growth",
    priority: "Next 30 Days",
    baseWeight: 86,
    title: "Prioritise Quality Growth",
    action:
      "Accept growth commitments only when production capacity, payment terms and delivery schedules remain manageable.",
    reason:
      "Sales growth can damage cashflow when payment terms and production capacity are not aligned.",
    signals: ["ControlledGrowthReady", "PositiveOperatingProfit"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Medium",
      implementationCost: "Low",
      estimatedImplementationDays: 30,
      confidence: 87,
      kpi: "Contribution margin by order",
      ownerRole: "Managing Director",
    },
  },
];