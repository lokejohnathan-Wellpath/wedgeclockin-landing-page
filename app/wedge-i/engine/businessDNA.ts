import type { BusinessType } from "./benchmarks";

export type BusinessDNAType =
  | BusinessType
  | "Slimming"
  | "Hospitality"
  | "Pet Business";

export type KpiUnit =
  | "currency"
  | "percentage"
  | "number"
  | "hours"
  | "days"
  | "ratio";

export type KpiDirection =
  | "higher-is-better"
  | "lower-is-better"
  | "range";

export type BusinessDNAKpi = {
  key: string;
  label: string;
  description: string;
  unit: KpiUnit;
  direction: KpiDirection;

  healthyMin?: number;
  healthyMax?: number;

  required: boolean;
  canBeIntegrated: boolean;

  integrationSource?:
    | "wedgeClockin"
    | "payroll"
    | "attendance"
    | "leave"
    | "sales"
    | "inventory"
    | "manual";
};

export type BusinessDNASignal = {
  id: string;
  title: string;
  description: string;
  severity: "positive" | "watch" | "high";
};

export type BusinessDNAProfile = {
  type: BusinessDNAType;
  executiveFocus: string;
  primaryQuestions: string[];
  kpis: BusinessDNAKpi[];
  positiveSignals: BusinessDNASignal[];
  riskSignals: BusinessDNASignal[];
  meetingPriorities: string[];
};

export const businessDNAProfiles: Record<
  BusinessDNAType,
  BusinessDNAProfile
> = {
  Retail: {
    type: "Retail",
    executiveFocus:
      "Sales productivity, inventory discipline, basket growth and workforce efficiency.",

    primaryQuestions: [
      "Is inventory growing faster than sales?",
      "Is average basket size improving?",
      "Are staff generating enough revenue per shift?",
      "Is slow-moving stock consuming cash?",
    ],

    kpis: [
      {
        key: "average-basket-size",
        label: "Average Basket Size",
        description:
          "Average sales value per completed customer transaction.",
        unit: "currency",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "inventory-turnover",
        label: "Inventory Turnover",
        description:
          "How frequently inventory is sold and replaced during the period.",
        unit: "ratio",
        direction: "higher-is-better",
        healthyMin: 2,
        required: true,
        canBeIntegrated: true,
        integrationSource: "inventory",
      },
      {
        key: "slow-moving-stock-percent",
        label: "Slow-Moving Stock",
        description:
          "Percentage of inventory that has remained unsold beyond the target period.",
        unit: "percentage",
        direction: "lower-is-better",
        healthyMax: 15,
        required: false,
        canBeIntegrated: true,
        integrationSource: "inventory",
      },
      {
        key: "revenue-per-staff",
        label: "Revenue per Staff",
        description:
          "Revenue generated per active employee during the reporting month.",
        unit: "currency",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "wedgeClockin",
      },
    ],

    positiveSignals: [
      {
        id: "retail-inventory-disciplined",
        title: "Inventory discipline is improving",
        description:
          "Inventory is stable or declining while revenue continues to grow.",
        severity: "positive",
      },
      {
        id: "retail-basket-growth",
        title: "Basket value is strengthening",
        description:
          "Average customer transaction value is rising across consecutive periods.",
        severity: "positive",
      },
    ],

    riskSignals: [
      {
        id: "retail-stock-accumulation",
        title: "Stock accumulation detected",
        description:
          "Inventory is increasing faster than revenue and may be absorbing cash.",
        severity: "high",
      },
      {
        id: "retail-productivity-pressure",
        title: "Store productivity weakening",
        description:
          "Payroll or staff count is rising faster than revenue.",
        severity: "watch",
      },
    ],

    meetingPriorities: [
      "Inventory ageing",
      "Top and bottom-selling categories",
      "Average basket size",
      "Revenue per staff",
      "Markdown and clearance decisions",
    ],
  },

  "F&B": {
    type: "F&B",
    executiveFocus:
      "Food cost control, labour productivity, outlet sales performance and order attachment.",

    primaryQuestions: [
      "Is food cost rising faster than revenue?",
      "Which shifts generate the best sales productivity?",
      "Are drinks and desserts improving total customer spend?",
      "Is labour cost aligned with outlet traffic?",
    ],

    kpis: [
      {
        key: "cogs-percent",
        label: "COGS Percentage",
        description:
          "Food and beverage cost as a percentage of total sales.",
        unit: "percentage",
        direction: "range",
        healthyMin: 25,
        healthyMax: 38,
        required: true,
        canBeIntegrated: true,
        integrationSource: "inventory",
      },
      {
        key: "drink-attachment-rate",
        label: "Drink Attachment Rate",
        description:
          "Percentage of food orders that also include a beverage.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 45,
        required: false,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "dessert-attachment-rate",
        label: "Dessert Attachment Rate",
        description:
          "Percentage of completed meals that include dessert.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 12,
        required: false,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "sales-per-waiter",
        label: "Sales per Waiter",
        description:
          "Revenue generated per waiter during the reporting period.",
        unit: "currency",
        direction: "higher-is-better",
        required: false,
        canBeIntegrated: true,
        integrationSource: "attendance",
      },
      {
        key: "sales-per-chef",
        label: "Sales per Chef",
        description:
          "Revenue supported per chef during the reporting period.",
        unit: "currency",
        direction: "higher-is-better",
        required: false,
        canBeIntegrated: true,
        integrationSource: "attendance",
      },
      {
        key: "takeaway-ratio",
        label: "Takeaway Ratio",
        description:
          "Percentage of revenue generated from takeaway and delivery orders.",
        unit: "percentage",
        direction: "range",
        required: false,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
    ],

    positiveSignals: [
      {
        id: "fb-food-cost-controlled",
        title: "Food cost is controlled",
        description:
          "COGS remains stable while revenue and gross profit improve.",
        severity: "positive",
      },
      {
        id: "fb-attachment-growth",
        title: "Order attachment is improving",
        description:
          "Beverage or dessert attachment is increasing customer spend.",
        severity: "positive",
      },
    ],

    riskSignals: [
      {
        id: "fb-cogs-pressure",
        title: "Food cost pressure detected",
        description:
          "COGS is increasing faster than revenue and may be compressing margin.",
        severity: "high",
      },
      {
        id: "fb-labour-productivity",
        title: "Labour productivity requires review",
        description:
          "Payroll is rising while sales per waiter or chef are weakening.",
        severity: "watch",
      },
    ],

    meetingPriorities: [
      "COGS and supplier pricing",
      "Sales per shift",
      "Drink and dessert attachment",
      "Labour scheduling",
      "Takeaway and dine-in mix",
    ],
  },

  "Beauty / Aesthetic / Medical": {
    type: "Beauty / Aesthetic / Medical",
    executiveFocus:
      "Consultant conversion, therapist utilisation, repeat visits and treatment profitability.",

    primaryQuestions: [
      "Are consultants converting enough enquiries?",
      "Are therapist hours fully utilised?",
      "Are repeat visits strengthening?",
      "Which treatments generate the best contribution margin?",
    ],

    kpis: [
      {
        key: "consultation-conversion-rate",
        label: "Consultation Conversion Rate",
        description:
          "Percentage of consultations converted into paid treatments or programmes.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 35,
        required: true,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "therapist-utilisation",
        label: "Therapist Utilisation",
        description:
          "Booked treatment hours as a percentage of available therapist hours.",
        unit: "percentage",
        direction: "range",
        healthyMin: 65,
        healthyMax: 90,
        required: true,
        canBeIntegrated: true,
        integrationSource: "attendance",
      },
      {
        key: "repeat-customer-rate",
        label: "Repeat Customer Rate",
        description:
          "Percentage of customers returning within the target period.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 45,
        required: true,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "product-upsell-rate",
        label: "Product Upsell Rate",
        description:
          "Percentage of treatment customers purchasing related retail products.",
        unit: "percentage",
        direction: "higher-is-better",
        required: false,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "revenue-per-therapist",
        label: "Revenue per Therapist",
        description:
          "Revenue generated per active therapist.",
        unit: "currency",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "wedgeClockin",
      },
    ],

    positiveSignals: [
      {
        id: "beauty-utilisation-healthy",
        title: "Therapist capacity is productive",
        description:
          "Utilisation and revenue per therapist are improving together.",
        severity: "positive",
      },
      {
        id: "beauty-repeat-growth",
        title: "Customer retention is strengthening",
        description:
          "Repeat customer rate is improving across consecutive periods.",
        severity: "positive",
      },
    ],

    riskSignals: [
      {
        id: "beauty-capacity-gap",
        title: "Unused therapist capacity detected",
        description:
          "Payroll remains high while therapist utilisation is below target.",
        severity: "high",
      },
      {
        id: "beauty-conversion-weakness",
        title: "Consultation conversion is weakening",
        description:
          "Consultations are not converting into sufficient paid treatments.",
        severity: "watch",
      },
    ],

    meetingPriorities: [
      "Consultation conversion",
      "Therapist utilisation",
      "Repeat customer rate",
      "Treatment margin",
      "Retail product upsell",
    ],
  },

  Slimming: {
    type: "Slimming",
    executiveFocus:
      "Programme conversion, completion, retention and revenue per consultant and therapist.",

    primaryQuestions: [
      "Are consultations converting into programmes?",
      "Are customers completing paid programmes?",
      "Is programme renewal improving?",
      "Are consultant and therapist hours generating enough value?",
    ],

    kpis: [
      {
        key: "programme-conversion-rate",
        label: "Programme Conversion Rate",
        description:
          "Percentage of slimming consultations converted into paid programmes.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 35,
        required: true,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "programme-completion-rate",
        label: "Programme Completion Rate",
        description:
          "Percentage of enrolled customers completing the agreed programme.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 75,
        required: true,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "programme-renewal-rate",
        label: "Programme Renewal Rate",
        description:
          "Percentage of completed customers purchasing a continuation programme.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 25,
        required: false,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "revenue-per-consultant",
        label: "Revenue per Consultant",
        description:
          "Monthly revenue generated per active consultant.",
        unit: "currency",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "wedgeClockin",
      },
    ],

    positiveSignals: [
      {
        id: "slimming-completion-healthy",
        title: "Programme completion is strong",
        description:
          "Customers are completing programmes at or above target levels.",
        severity: "positive",
      },
    ],

    riskSignals: [
      {
        id: "slimming-dropout-risk",
        title: "Programme dropout requires attention",
        description:
          "Programme completion is weakening and may affect retention and reputation.",
        severity: "high",
      },
    ],

    meetingPriorities: [
      "Consultation conversion",
      "Programme completion",
      "Customer dropout",
      "Programme renewal",
      "Revenue per consultant",
    ],
  },

  Service: {
    type: "Service",
    executiveFocus:
      "Billable utilisation, project margin, revenue per employee and client retention.",

    primaryQuestions: [
      "Are employees spending enough time on billable work?",
      "Are project margins improving?",
      "Is revenue per employee increasing?",
      "Are clients returning or renewing?",
    ],

    kpis: [
      {
        key: "billable-utilisation",
        label: "Billable Utilisation",
        description:
          "Billable hours as a percentage of total available working hours.",
        unit: "percentage",
        direction: "range",
        healthyMin: 65,
        healthyMax: 85,
        required: true,
        canBeIntegrated: true,
        integrationSource: "attendance",
      },
      {
        key: "project-margin",
        label: "Project Margin",
        description:
          "Operating contribution generated by completed service projects.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 20,
        required: true,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "client-retention-rate",
        label: "Client Retention Rate",
        description:
          "Percentage of customers renewing or purchasing again.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 70,
        required: false,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "revenue-per-employee",
        label: "Revenue per Employee",
        description:
          "Monthly revenue generated per active employee.",
        unit: "currency",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "wedgeClockin",
      },
    ],

    positiveSignals: [
      {
        id: "service-utilisation-healthy",
        title: "Billable utilisation is healthy",
        description:
          "Available working hours are converting efficiently into revenue.",
        severity: "positive",
      },
    ],

    riskSignals: [
      {
        id: "service-utilisation-low",
        title: "Billable utilisation is low",
        description:
          "Payroll remains committed while too few hours are generating revenue.",
        severity: "high",
      },
    ],

    meetingPriorities: [
      "Billable utilisation",
      "Project margin",
      "Client retention",
      "Revenue per employee",
      "Unbilled work",
    ],
  },

  Hospitality: {
    type: "Hospitality",
    executiveFocus:
      "Occupancy, room pricing, RevPAR, guest spend and workforce productivity.",

    primaryQuestions: [
      "Are occupancy and room rates improving together?",
      "Is RevPAR strengthening?",
      "Are guests spending beyond room revenue?",
      "Is staffing aligned with occupied rooms?",
    ],

    kpis: [
      {
        key: "occupancy-rate",
        label: "Occupancy Rate",
        description:
          "Percentage of available rooms or units occupied.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 65,
        required: true,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "adr",
        label: "Average Daily Rate",
        description:
          "Average room revenue earned per occupied room.",
        unit: "currency",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "revpar",
        label: "RevPAR",
        description:
          "Revenue per available room.",
        unit: "currency",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "guest-spend",
        label: "Average Guest Spend",
        description:
          "Average total spend per guest including rooms and additional services.",
        unit: "currency",
        direction: "higher-is-better",
        required: false,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "revenue-per-staff",
        label: "Revenue per Staff",
        description:
          "Monthly revenue generated per active employee.",
        unit: "currency",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "wedgeClockin",
      },
    ],

    positiveSignals: [
      {
        id: "hospitality-revpar-growth",
        title: "RevPAR is strengthening",
        description:
          "Occupancy and average room rate are improving together.",
        severity: "positive",
      },
    ],

    riskSignals: [
      {
        id: "hospitality-rate-discount",
        title: "Occupancy is being purchased through discounting",
        description:
          "Occupancy is rising while average room rate is weakening.",
        severity: "watch",
      },
    ],

    meetingPriorities: [
      "Occupancy",
      "ADR",
      "RevPAR",
      "Guest spend",
      "Labour scheduling",
    ],
  },

  Manufacturing: {
    type: "Manufacturing",
    executiveFocus:
      "Equipment effectiveness, yield, downtime, scrap and labour productivity.",

    primaryQuestions: [
      "Is equipment producing at expected capacity?",
      "Is downtime affecting delivery output?",
      "Are scrap and rework increasing?",
      "Are labour hours translating into finished units?",
    ],

    kpis: [
      {
        key: "oee",
        label: "Overall Equipment Effectiveness",
        description:
          "Combined measure of equipment availability, performance and quality.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 75,
        required: true,
        canBeIntegrated: true,
        integrationSource: "manual",
      },
      {
        key: "downtime-hours",
        label: "Downtime Hours",
        description:
          "Total production hours lost due to equipment or process interruption.",
        unit: "hours",
        direction: "lower-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "manual",
      },
      {
        key: "scrap-rate",
        label: "Scrap Rate",
        description:
          "Percentage of production output rejected or discarded.",
        unit: "percentage",
        direction: "lower-is-better",
        healthyMax: 3,
        required: true,
        canBeIntegrated: true,
        integrationSource: "manual",
      },
      {
        key: "production-yield",
        label: "Production Yield",
        description:
          "Percentage of input converted into acceptable finished output.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 95,
        required: true,
        canBeIntegrated: true,
        integrationSource: "manual",
      },
      {
        key: "units-per-labour-hour",
        label: "Units per Labour Hour",
        description:
          "Finished units produced for each recorded labour hour.",
        unit: "number",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "attendance",
      },
    ],

    positiveSignals: [
      {
        id: "manufacturing-yield-growth",
        title: "Production yield is improving",
        description:
          "More acceptable output is being produced from the same input base.",
        severity: "positive",
      },
    ],

    riskSignals: [
      {
        id: "manufacturing-downtime",
        title: "Downtime is reducing output",
        description:
          "Production interruption is weakening capacity and labour productivity.",
        severity: "high",
      },
      {
        id: "manufacturing-scrap",
        title: "Scrap and rework pressure detected",
        description:
          "Reject rates are increasing and may be compressing margin.",
        severity: "high",
      },
    ],

    meetingPriorities: [
      "OEE",
      "Downtime",
      "Scrap and rework",
      "Production yield",
      "Units per labour hour",
    ],
  },

  "Pet Business": {
    type: "Pet Business",
    executiveFocus:
      "Grooming utilisation, boarding occupancy, spend per pet and recurring membership.",

    primaryQuestions: [
      "Are grooming slots being fully utilised?",
      "Is boarding occupancy healthy?",
      "Is average spend per pet improving?",
      "Are customers renewing memberships and packages?",
    ],

    kpis: [
      {
        key: "grooming-utilisation",
        label: "Grooming Utilisation",
        description:
          "Booked grooming hours as a percentage of available grooming capacity.",
        unit: "percentage",
        direction: "range",
        healthyMin: 65,
        healthyMax: 90,
        required: true,
        canBeIntegrated: true,
        integrationSource: "attendance",
      },
      {
        key: "boarding-occupancy",
        label: "Boarding Occupancy",
        description:
          "Percentage of available boarding capacity occupied.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 55,
        required: false,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "average-spend-per-pet",
        label: "Average Spend per Pet",
        description:
          "Average monthly revenue generated per active pet customer.",
        unit: "currency",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "membership-renewal-rate",
        label: "Membership Renewal Rate",
        description:
          "Percentage of pet-care memberships or packages renewed.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 60,
        required: false,
        canBeIntegrated: true,
        integrationSource: "sales",
      },
      {
        key: "revenue-per-groomer",
        label: "Revenue per Groomer",
        description:
          "Monthly grooming revenue generated per active groomer.",
        unit: "currency",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "wedgeClockin",
      },
    ],

    positiveSignals: [
      {
        id: "pet-grooming-utilisation",
        title: "Grooming capacity is productive",
        description:
          "Grooming utilisation and revenue per groomer are improving together.",
        severity: "positive",
      },
    ],

    riskSignals: [
      {
        id: "pet-capacity-gap",
        title: "Pet-care capacity is underused",
        description:
          "Payroll remains committed while grooming or boarding utilisation is weak.",
        severity: "watch",
      },
    ],

    meetingPriorities: [
      "Grooming utilisation",
      "Boarding occupancy",
      "Average spend per pet",
      "Membership renewal",
      "Revenue per groomer",
    ],
  },

  "General SME": {
    type: "General SME",
    executiveFocus:
      "Revenue, profit, cash, payroll efficiency and operational stability.",

    primaryQuestions: [
      "Is revenue growing profitably?",
      "Is payroll aligned with sales?",
      "Is cash runway improving?",
      "Are operating costs under control?",
    ],

    kpis: [
      {
        key: "profit-margin",
        label: "Profit Margin",
        description:
          "Operating profit generated as a percentage of revenue.",
        unit: "percentage",
        direction: "higher-is-better",
        healthyMin: 12,
        required: true,
        canBeIntegrated: true,
        integrationSource: "manual",
      },
      {
        key: "cash-runway",
        label: "Cash Runway",
        description:
          "Estimated number of months current cash can support operating costs.",
        unit: "number",
        direction: "higher-is-better",
        healthyMin: 2,
        required: true,
        canBeIntegrated: true,
        integrationSource: "manual",
      },
      {
        key: "labour-ratio",
        label: "Labour Cost Ratio",
        description:
          "Payroll as a percentage of revenue.",
        unit: "percentage",
        direction: "range",
        healthyMin: 15,
        healthyMax: 30,
        required: true,
        canBeIntegrated: true,
        integrationSource: "payroll",
      },
      {
        key: "revenue-per-staff",
        label: "Revenue per Staff",
        description:
          "Monthly revenue generated per active employee.",
        unit: "currency",
        direction: "higher-is-better",
        required: true,
        canBeIntegrated: true,
        integrationSource: "wedgeClockin",
      },
    ],

    positiveSignals: [
      {
        id: "general-profitable-growth",
        title: "Growth remains profitable",
        description:
          "Revenue, margin and cash are improving together.",
        severity: "positive",
      },
    ],

    riskSignals: [
      {
        id: "general-cash-pressure",
        title: "Cash pressure detected",
        description:
          "Cash runway is weakening while operating commitments remain high.",
        severity: "high",
      },
    ],

    meetingPriorities: [
      "Revenue and margin",
      "Cash runway",
      "Payroll efficiency",
      "Operating expenses",
      "Next-quarter priorities",
    ],
  },
};

export function getBusinessDNAProfile(type: BusinessDNAType) {
  return businessDNAProfiles[type];
}

export function isBusinessDNAType(
  value: string,
): value is BusinessDNAType {
  return value in businessDNAProfiles;
}