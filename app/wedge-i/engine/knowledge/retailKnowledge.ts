import type { KnowledgeRecommendation } from "./types";

export const retailKnowledge: KnowledgeRecommendation[] = [
  {
    id: "RTL-001",
    industries: ["Retail"],
    category: "Inventory",
    priority: "Next 7 Days",
    baseWeight: 96,
    title: "Review Stock Ageing",
    action:
      "Separate fast-moving, slow-moving and non-moving products before approving the next supplier order.",
    reason:
      "Ageing stock reduces cash availability and increases discount pressure.",
    signals: ["HighInventoryPressure", "GeneralIndustryOpportunity"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Low",
      implementationCost: "Low",
      estimatedImplementationDays: 3,
      confidence: 92,
      kpi: "Inventory ageing days",
      ownerRole: "Store Manager",
    },
  },
  {
    id: "RTL-002",
    industries: ["Retail"],
    category: "Commercial",
    priority: "Next 7 Days",
    baseWeight: 92,
    title: "Increase Basket Size",
    action:
      "Use complementary bundles, counter recommendations and product add-ons instead of applying store-wide discounts.",
    reason:
      "Basket growth can improve revenue without requiring additional customer traffic.",
    signals: ["GeneralIndustryOpportunity", "PositiveOperatingProfit"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Low",
      implementationCost: "Low",
      estimatedImplementationDays: 7,
      confidence: 88,
      kpi: "Average basket value",
      ownerRole: "Sales Manager",
    },
  },
  {
    id: "RTL-003",
    industries: ["Retail"],
    category: "Financial",
    priority: "Immediate",
    baseWeight: 100,
    title: "Protect Product Margin",
    action:
      "Review supplier cost, discount depth and contribution margin by product category.",
    reason:
      "Revenue growth does not improve the business if promotional activity removes operating margin.",
    signals: ["LowProfitMargin", "OperatingLoss"],
    metadata: {
      expectedImpact: "Critical",
      implementationEffort: "Medium",
      implementationCost: "Low",
      estimatedImplementationDays: 5,
      confidence: 95,
      kpi: "Gross margin percentage",
      ownerRole: "Owner / Finance",
    },
  },
  {
    id: "RTL-004",
    industries: ["Retail"],
    category: "Cashflow",
    priority: "Immediate",
    baseWeight: 98,
    title: "Reduce Cash Tied Up in Stock",
    action:
      "Pause non-essential replenishment and prioritise stock with proven sales velocity.",
    reason:
      "Excess purchasing weakens cash runway and increases inventory risk.",
    signals: ["ShortCashRunway", "HighInventoryPressure"],
    metadata: {
      expectedImpact: "Critical",
      implementationEffort: "Low",
      implementationCost: "Low",
      estimatedImplementationDays: 2,
      confidence: 94,
      kpi: "Cash tied up in inventory",
      ownerRole: "Purchasing Manager",
    },
  },
  {
    id: "RTL-005",
    industries: ["Retail"],
    category: "Calendar",
    priority: "Next 7 Days",
    baseWeight: 87,
    title: "Prepare for Demand Windows",
    action:
      "Confirm stock, roster and campaign materials before payday periods or long weekends while avoiding over-ordering.",
    reason:
      "Consumer traffic may increase during Malaysian spending windows, but excess stock can reduce post-campaign cashflow.",
    signals: ["PaydayWindow", "LongWeekendPlanning"],
    metadata: {
      expectedImpact: "Medium",
      implementationEffort: "Low",
      implementationCost: "Medium",
      estimatedImplementationDays: 7,
      confidence: 82,
      kpi: "Campaign sales conversion",
      ownerRole: "Store Manager",
    },
  },
  {
    id: "RTL-006",
    industries: ["Retail"],
    category: "Labour",
    priority: "Immediate",
    baseWeight: 94,
    title: "Align Staffing with Trading Hours",
    action:
      "Compare hourly or shift sales against payroll allocation before approving overtime.",
    reason:
      "Staffing should follow customer traffic rather than fixed scheduling habits.",
    signals: ["HighLabourRatio"],
    metadata: {
      expectedImpact: "High",
      implementationEffort: "Medium",
      implementationCost: "Low",
      estimatedImplementationDays: 7,
      confidence: 90,
      kpi: "Sales per labour hour",
      ownerRole: "Operations Manager",
    },
  },
];