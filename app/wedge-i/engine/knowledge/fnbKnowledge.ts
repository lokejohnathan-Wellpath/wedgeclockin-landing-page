import type { KnowledgeRecommendation } from "./types";

export const fnbKnowledge: KnowledgeRecommendation[] = [
  {
    id: "FNB-001",
    industries: ["F&B"],
    category: "Commercial",
    priority: "Next 7 Days",
    baseWeight: 95,
    title: "Increase Average Receipt",
    action:
      "Promote family sets, beverage add-ons and premium meal combinations instead of broad percentage discounts.",
    reason:
      "Higher average receipt generally improves gross profit faster than relying only on additional customer traffic.",
    signals: ["GeneralIndustryOpportunity"],
  },

  {
    id: "FNB-002",
    industries: ["F&B"],
    category: "Labour",
    priority: "Immediate",
    baseWeight: 98,
    title: "Optimise Staff Roster",
    action:
      "Review manpower allocation using actual lunch, dinner and weekend trading patterns before approving overtime.",
    reason:
      "Labour cost should follow customer demand rather than fixed schedules.",
    signals: ["HighLabourRatio"],
  },

  {
    id: "FNB-003",
    industries: ["F&B"],
    category: "Financial",
    priority: "Immediate",
    baseWeight: 100,
    title: "Protect Operating Margin",
    action:
      "Review food cost, supplier pricing, menu contribution margin and unnecessary promotional discounts.",
    reason:
      "Improving gross margin has a direct impact on operating profit.",
    signals: ["LowProfitMargin", "OperatingLoss"],
  },

  {
    id: "FNB-004",
    industries: ["F&B"],
    category: "Operations",
    priority: "Next 7 Days",
    baseWeight: 90,
    title: "Reduce Food Wastage",
    action:
      "Monitor daily food wastage, portion consistency and slow-moving ingredients before placing the next supplier order.",
    reason:
      "Food wastage directly reduces restaurant profitability.",
    signals: ["GeneralIndustryOpportunity"],
  },

  {
    id: "FNB-005",
    industries: ["F&B"],
    category: "Cashflow",
    priority: "Immediate",
    baseWeight: 99,
    title: "Protect Cash Position",
    action:
      "Delay non-essential purchases and prioritise inventory with faster turnover until cash runway improves.",
    reason:
      "Cash preservation provides flexibility during slower trading periods.",
    signals: ["ShortCashRunway"],
  },

  {
    id: "FNB-006",
    industries: ["F&B"],
    category: "Calendar",
    priority: "Next 7 Days",
    baseWeight: 92,
    title: "Prepare for Malaysian Trading Rhythm",
    action:
      "Align stock purchasing, staffing and marketing with upcoming consumer spending periods and expected demand.",
    reason:
      "Seasonal trading behaviour affects customer traffic and inventory planning.",
    signals: ["PaydayWindow", "LongWeekendPlanning"],
  },

  {
    id: "FNB-007",
    industries: ["F&B"],
    category: "Growth",
    priority: "Next 30 Days",
    baseWeight: 85,
    title: "Increase Customer Frequency",
    action:
      "Introduce loyalty programmes, WhatsApp promotions and repeat-visit campaigns instead of relying only on new customers.",
    reason:
      "Repeat customers usually generate more stable long-term revenue.",
    signals: ["PositiveOperatingProfit"],
  },
];