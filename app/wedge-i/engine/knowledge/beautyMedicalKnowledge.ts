import type { KnowledgeRecommendation } from "./types";

export const beautyMedicalKnowledge: KnowledgeRecommendation[] = [
  {
    id: "BMD-001",
    industries: ["Beauty / Aesthetic / Medical"],
    category: "Commercial",
    priority: "Next 7 Days",
    baseWeight: 96,
    title: "Increase Treatment Value",
    action:
      "Create treatment packages that combine professional services with suitable home-care products or prepaid maintenance.",
    reason:
      "Packages can improve gross profit and customer outcomes without increasing acquisition cost.",
    signals: ["GeneralIndustryOpportunity", "LowProfitMargin"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Medium",
      implementationCost: "Low",
      estimatedImplementationDays: 10,
      confidence: 92,
      kpi: "Average client spend",
      ownerRole: "Clinic / Centre Manager",
    },
  },
  {
    id: "BMD-002",
    industries: ["Beauty / Aesthetic / Medical"],
    category: "Customer",
    priority: "Next 7 Days",
    baseWeight: 94,
    title: "Improve Client Revisit Discipline",
    action:
      "Follow up clients due for treatment review, maintenance, product refill or consultation using a structured WhatsApp list.",
    reason:
      "Repeat clients generally produce stronger margins than constant new-customer acquisition.",
    signals: ["GeneralIndustryOpportunity", "PositiveOperatingProfit"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Low",
      implementationCost: "Low",
      estimatedImplementationDays: 7,
      confidence: 93,
      kpi: "Client revisit rate",
      ownerRole: "Customer Care Team",
    },
  },
  {
    id: "BMD-003",
    industries: ["Beauty / Aesthetic / Medical"],
    category: "Growth",
    priority: "Next 30 Days",
    baseWeight: 88,
    title: "Increase Product Attachment",
    action:
      "Track how frequently recommended home-care products are purchased together with treatments.",
    reason:
      "Product attachment can raise gross profit while supporting treatment maintenance.",
    signals: ["GeneralIndustryOpportunity", "ControlledGrowthReady"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Medium",
      implementationCost: "Medium",
      estimatedImplementationDays: 21,
      confidence: 88,
      kpi: "Product attachment rate",
      ownerRole: "Sales / Clinical Team",
    },
  },
  {
    id: "BMD-004",
    industries: ["Beauty / Aesthetic / Medical"],
    category: "Labour",
    priority: "Immediate",
    baseWeight: 97,
    title: "Improve Capacity Utilisation",
    action:
      "Review therapist, consultant, doctor and treatment-room utilisation before increasing headcount.",
    reason:
      "Unused capacity should be improved before fixed payroll cost expands.",
    signals: ["HighLabourRatio", "LowRevenuePerStaff"],
    metadata: {
      expectedImpact: "Critical",
      implementationEffort: "Medium",
      implementationCost: "Low",
      estimatedImplementationDays: 14,
      confidence: 94,
      kpi: "Revenue per practitioner",
      ownerRole: "Operations Manager",
    },
  },
  {
    id: "BMD-005",
    industries: ["Beauty / Aesthetic / Medical"],
    category: "Cashflow",
    priority: "Immediate",
    baseWeight: 98,
    title: "Protect Cash Position",
    action:
      "Control non-essential equipment, inventory and marketing commitments until cash runway improves.",
    reason:
      "High fixed costs and product inventory can quickly reduce cash flexibility.",
    signals: ["ShortCashRunway"],
    metadata: {
      expectedImpact: "Critical",
      implementationEffort: "Low",
      implementationCost: "Low",
      estimatedImplementationDays: 2,
      confidence: 95,
      kpi: "Cash runway weeks",
      ownerRole: "Owner / Finance",
    },
  },
  {
    id: "BMD-006",
    industries: ["Beauty / Aesthetic / Medical"],
    category: "Calendar",
    priority: "Next 7 Days",
    baseWeight: 86,
    title: "Prepare Appointment Capacity",
    action:
      "Confirm staffing, appointment availability and product readiness before payday periods or long weekends.",
    reason:
      "Consumer appointment demand may rise during Malaysian spending and holiday windows.",
    signals: ["PaydayWindow", "LongWeekendPlanning"],
    metadata: {
      expectedImpact: "Medium",
      implementationEffort: "Low",
      implementationCost: "Low",
      estimatedImplementationDays: 5,
      confidence: 84,
      kpi: "Appointment utilisation",
      ownerRole: "Front Desk Manager",
    },
  },
];