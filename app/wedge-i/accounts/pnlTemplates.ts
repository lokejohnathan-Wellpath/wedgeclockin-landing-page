import type { IndustryPnlTemplate, ManagedAccountIndustry, PnlAccountLine } from "./types";

function line(code: string, label: string, group: PnlAccountLine["group"]): PnlAccountLine {
  return { code, label, group };
}

const commonOpex: PnlAccountLine[] = [
  line("STAFF", "Staff cost", "staff_cost"),
  line("RENT", "Rental / occupancy", "occupancy"),
  line("UTIL", "Utilities", "utilities"),
  line("MKT", "Sales & marketing", "sales_marketing"),
  line("LOG", "Transport / logistics", "transport_logistics"),
  line("R&M", "Repairs & maintenance", "repairs_maintenance"),
  line("ADMIN", "Administration", "administration"),
  line("PROTECH", "Professional fees / software", "professional_technology"),
  line("DEP", "Depreciation", "depreciation"),
  line("OTHER_OPEX", "Other operating expenses", "other_operating_expense"),
];

const templates: IndustryPnlTemplate[] = [
  {
    industry: "F&B - Restaurant / Cafe / QSR",
    revenueLines: [
      line("FOOD_SALES", "Food sales", "revenue"),
      line("BEV_SALES", "Beverage sales", "revenue"),
      line("OTHER_SALES", "Other operating sales", "revenue"),
    ],
    directCostLines: [
      line("FOOD_COST", "Food cost", "direct_cost"),
      line("BEV_COST", "Beverage cost", "direct_cost"),
      line("PACKAGING", "Packaging", "direct_cost"),
    ],
    operatingExpenseLines: [
      line("SALARY", "Salary", "staff_cost"),
      line("OT", "Overtime", "staff_cost"),
      line("EMPLOYER_CONTRIB", "Employer contributions", "staff_cost"),
      line("RENT", "Rental", "occupancy"),
      line("ELECTRIC", "Electricity", "utilities"),
      line("WATER_GAS", "Water / gas", "utilities"),
      line("DELIVERY_COMMISSION", "Delivery commissions", "sales_marketing"),
      line("CLEANING", "Cleaning / pest control", "other_operating_expense"),
      line("R&M", "Repairs & maintenance", "repairs_maintenance"),
      line("MKT", "Marketing", "sales_marketing"),
      line("PROTECH", "Software / professional fees", "professional_technology"),
    ],
    kpis: ["food cost %", "beverage cost %", "labour %", "gross margin %", "operating margin %", "sales per day"],
    supportsRestaurantTenderBreakdown: true,
  },
  {
    industry: "Retail",
    revenueLines: [line("RETAIL_SALES", "Retail sales", "revenue")],
    directCostLines: [line("COGS", "Cost of goods sold", "direct_cost")],
    operatingExpenseLines: commonOpex,
    kpis: ["gross margin %", "inventory turnover", "sales per employee", "payroll %"],
  },
  {
    industry: "Construction / Renovation",
    revenueLines: [
      line("CONTRACT_REVENUE", "Contract revenue", "revenue"),
      line("VARIATION_ORDERS", "Variation orders", "revenue"),
    ],
    directCostLines: [
      line("MATERIALS", "Materials", "direct_cost"),
      line("SITE_LABOUR", "Site labour", "direct_cost"),
      line("SUBCONTRACTORS", "Subcontractors", "direct_cost"),
      line("MACHINERY_HIRE", "Machinery hire", "direct_cost"),
      line("SITE_TRANSPORT", "Site transport", "direct_cost"),
    ],
    operatingExpenseLines: commonOpex,
    kpis: ["project gross margin %", "material %", "labour %", "subcontractor %", "project variance"],
  },
  {
    industry: "Manufacturing",
    revenueLines: [line("FINISHED_GOODS", "Finished goods sales", "revenue")],
    directCostLines: [
      line("RAW_MATERIALS", "Raw materials", "direct_cost"),
      line("DIRECT_LABOUR", "Direct labour", "direct_cost"),
      line("FACTORY_UTILITIES", "Factory utilities", "direct_cost"),
      line("PRODUCTION_CONSUMABLES", "Production consumables", "direct_cost"),
      line("FACTORY_OVERHEAD", "Factory overhead", "direct_cost"),
    ],
    operatingExpenseLines: commonOpex,
    kpis: ["material %", "labour per unit", "yield %", "gross profit per unit", "factory utilisation"],
  },
  {
    industry: "Beauty / Salon / Spa",
    revenueLines: [
      line("SERVICE_REVENUE", "Service revenue", "revenue"),
      line("TREATMENT_REVENUE", "Treatment revenue", "revenue"),
      line("PRODUCT_SALES", "Retail product sales", "revenue"),
    ],
    directCostLines: [
      line("TREATMENT_CONSUMABLES", "Treatment consumables", "direct_cost"),
      line("RETAIL_COGS", "Retail product cost", "direct_cost"),
    ],
    operatingExpenseLines: [
      line("SALARY", "Salary", "staff_cost"),
      line("SERVICE_COMMISSION", "Service commission", "staff_cost"),
      line("PRODUCT_COMMISSION", "Product commission", "staff_cost"),
      ...commonOpex.filter((item) => item.group !== "staff_cost"),
    ],
    kpis: ["service margin %", "product margin %", "commission %", "revenue per staff"],
  },
];

const fallbackIndustries: ManagedAccountIndustry[] = [
  "Bakery / Central Kitchen",
  "Wholesale / Distribution",
  "E-commerce",
  "Automotive Workshop",
  "Clinic / Dental / Healthcare",
  "Professional Services",
  "Education / Training",
  "Hotel / Accommodation",
  "Property Rental / Management",
  "Logistics / Transport",
  "Agriculture / Aquaculture",
  "Trading / Import Export",
  "Technology / SaaS",
  "Agency / Events",
  "Cleaning / Security / Manpower",
  "Engineering / Maintenance",
  "Mining / Quarry / Materials",
  "Other SME",
];

for (const industry of fallbackIndustries) {
  templates.push({
    industry,
    revenueLines: [line("REVENUE", "Operating revenue", "revenue")],
    directCostLines: [line("DIRECT_COST", "Direct cost / cost of sales", "direct_cost")],
    operatingExpenseLines: commonOpex,
    kpis: ["gross margin %", "labour %", "operating margin %", "revenue per employee"],
  });
}

export const INDUSTRY_PNL_TEMPLATES: Record<ManagedAccountIndustry, IndustryPnlTemplate> = Object.fromEntries(
  templates.map((template) => [template.industry, template]),
) as Record<ManagedAccountIndustry, IndustryPnlTemplate>;

export function getIndustryPnlTemplate(industry: ManagedAccountIndustry) {
  return INDUSTRY_PNL_TEMPLATES[industry];
}
