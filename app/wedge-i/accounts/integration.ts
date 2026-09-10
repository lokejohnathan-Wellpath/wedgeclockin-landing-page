import { reconcileDocumentCategories, type BookDocument } from "../books/brain";
import { getIndustryPnlTemplate } from "./pnlTemplates";
import type { PnlValueMap } from "./pnlEngine";
import type { ManagedAccountIndustry, PnlAccountLine } from "./types";

export type PayrollRecordForPnl = {
  id: string;
  month: number;
  year: number;
  basicSalary: number;
  allowanceA?: number;
  allowanceB?: number;
  allowanceC?: number;
  monthlyIncentive?: number;
  otHours?: number;
  otRate?: number;
  otPay?: number;
  epfEmployerContribution?: number;
  socsoEmployerContribution?: number;
  eisEmployerContribution?: number;
  status?: "draft" | "issued";
  isAdjustment?: boolean;
};

export type IntegratedPnlInput = {
  values: PnlValueMap;
  warnings: string[];
  stats: {
    bookDocuments: number;
    purchaseDocuments: number;
    salesDocuments: number;
    needsReviewDocuments: number;
    issuedPayrollRecords: number;
    draftPayrollRecords: number;
  };
};

const categoryCodePreferences: Record<string, string[]> = {
  "Sales Income": ["RETAIL_SALES", "WHOLESALE_SALES", "SERVICE_REVENUE", "ROOM_REVENUE", "CONTRACT_REVENUE", "SUBSCRIPTION_REVENUE", "CORE_REVENUE"],
  "Food Items": ["FOOD_COST", "OTHER_INGREDIENTS", "DIRECT_MATERIAL", "PRODUCT_COGS"],
  "Ingredients & Beverages": ["FOOD_COST", "BEVERAGE_COST", "OTHER_INGREDIENTS", "DIRECT_MATERIAL"],
  "Direct Purchases": ["DIRECT_MATERIAL", "PROJECT_MATERIALS", "PARTS_COST", "PRODUCT_COGS", "DIRECT_COST"],
  "Goods for Resale": ["PRODUCT_COGS", "PRODUCT_PURCHASES", "PURCHASE_COST", "PARTS_COST", "RETAIL_COGS", "COGS"],
  Packaging: ["PACKAGING"],
  "Treatment Consumables": ["TREATMENT_CONSUMABLES", "DISPOSABLES"],
  "Pet Care Consumables": ["DIRECT_MATERIAL", "DIRECT_COST"],
  "Raw Materials": ["RAW_MATERIALS", "DIRECT_MATERIAL", "MATERIALS"],
  "Production Overhead": ["OTHER_FACTORY_OVERHEAD", "FACTORY_OVERHEAD", "PRODUCTION_CONSUMABLES", "PLANT_OPERATING"],
  "Medical / Healthcare": ["MEDICAL_CONSUMABLES", "MEDICINE_COST"],
  "TNB / Electricity": ["ELECTRIC", "ELECTRICITY", "ELECTRIC_GAS", "FACTORY_UTILITIES", "FARM_UTILITIES", "UTILITIES"],
  Water: ["WATER", "WATER_GAS", "FACTORY_UTILITIES", "FARM_UTILITIES", "UTILITIES"],
  Gas: ["WATER_GAS", "ELECTRIC_GAS", "FACTORY_UTILITIES", "UTILITIES"],
  Utilities: ["UTILITIES", "ELECTRIC", "ELECTRICITY", "FACTORY_UTILITIES", "FARM_UTILITIES"],
  "Rent & Premises": ["RENT", "STORE_RENT", "WAREHOUSE_RENT", "OFFICE_RENT", "CENTRE_RENT", "WORKSHOP_RENT", "DEPOT_RENT", "LAND_RENT", "SITE_RENT"],
  "Repairs & Maintenance": ["REPAIRS", "EQUIPMENT_REPAIR", "EQUIPMENT_SERVICE", "VEHICLE_REPAIR", "MACHINERY_REPAIR", "HEAVY_MAINTENANCE"],
  "Transport & Delivery": ["DELIVERY", "OUTBOUND_DELIVERY", "COURIER", "TRANSPORT", "VEHICLE_COST", "OUTBOUND_FREIGHT", "HAULAGE"],
  "Office & Administration": ["ADMIN", "OFFICE_ADMIN", "CUSTOMER_SERVICE", "LICENSES"],
  "Professional Fees": ["PROFESSIONAL", "LEGAL_PROFESSIONAL", "PROFESSIONAL_MEMBERSHIP", "SOFTWARE"],
  "Other Expense": ["OTHER_OPEX"],
};

const payrollAllocationSensitiveIndustries: ManagedAccountIndustry[] = [
  "Bakery / Central Kitchen",
  "Automotive Workshop",
  "Construction / Renovation",
  "Manufacturing",
  "Logistics / Transport",
  "Agriculture / Aquaculture",
  "Cleaning / Security / Manpower",
  "Engineering / Maintenance",
  "Mining / Quarry / Materials",
];

function add(values: PnlValueMap, code: string, amount: number) {
  if (!Number.isFinite(amount) || amount === 0) return;
  values[code] = Math.round(((values[code] || 0) + amount) * 100) / 100;
}

function periodKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function linesForIndustry(industry: ManagedAccountIndustry) {
  const template = getIndustryPnlTemplate(industry);
  return [...template.revenueLines, ...template.directCostLines, ...template.operatingExpenseLines];
}

function findCode(lines: PnlAccountLine[], preferences: string[]) {
  for (const code of preferences) {
    if (lines.some((line) => line.code === code)) return code;
  }
  return null;
}

function firstCodeByGroup(lines: PnlAccountLine[], group: PnlAccountLine["group"]) {
  return lines.find((line) => line.group === group)?.code || null;
}

function mapBookCategoryToCode(category: string, industry: ManagedAccountIndustry) {
  const lines = linesForIndustry(industry);
  const preferred = findCode(lines, categoryCodePreferences[category] || []);
  if (preferred) return preferred;

  if (["Food Items", "Ingredients & Beverages", "Direct Purchases", "Goods for Resale", "Packaging", "Treatment Consumables", "Pet Care Consumables", "Raw Materials", "Production Overhead", "Medical / Healthcare"].includes(category)) {
    return firstCodeByGroup(lines, "direct_cost");
  }
  if (["TNB / Electricity", "Water", "Gas", "Utilities"].includes(category)) return firstCodeByGroup(lines, "utilities");
  if (category === "Rent & Premises") return firstCodeByGroup(lines, "occupancy");
  if (category === "Repairs & Maintenance") return firstCodeByGroup(lines, "repairs_maintenance");
  if (category === "Transport & Delivery") return firstCodeByGroup(lines, "transport_logistics");
  if (category === "Office & Administration") return firstCodeByGroup(lines, "administration");
  if (category === "Professional Fees") return firstCodeByGroup(lines, "professional_technology");
  if (category === "Other Expense") return firstCodeByGroup(lines, "other_operating_expense");
  if (category === "Sales Income") return firstCodeByGroup(lines, "revenue");
  return null;
}

function grossEmploymentCost(record: PayrollRecordForPnl) {
  const ot = Number.isFinite(record.otPay)
    ? Number(record.otPay)
    : Number(record.otHours || 0) * Number(record.otRate || 0);
  return (
    Number(record.basicSalary || 0) +
    Number(record.allowanceA || 0) +
    Number(record.allowanceB || 0) +
    Number(record.allowanceC || 0) +
    Number(record.monthlyIncentive || 0) +
    ot +
    Number(record.epfEmployerContribution || 0) +
    Number(record.socsoEmployerContribution || 0) +
    Number(record.eisEmployerContribution || 0)
  );
}

function defaultPayrollCode(industry: ManagedAccountIndustry) {
  const lines = getIndustryPnlTemplate(industry).operatingExpenseLines.filter((line) => line.group === "staff_cost");
  const preferred = [
    "SALARY",
    "STORE_PAYROLL",
    "ECOM_PAYROLL",
    "HOTEL_PAYROLL",
    "TEAM_PAYROLL",
    "OPS_PAYROLL",
    "TRADING_PAYROLL",
    "CLINICAL_PAYROLL",
    "ADMIN_PAYROLL",
    "HQ_PAYROLL",
    "SUPERVISORY_PAYROLL",
    "MANAGEMENT_PAYROLL",
    "GNA_PAYROLL",
  ];
  return findCode(lines, preferred) || lines[0]?.code || null;
}

export function buildIntegratedPnlInput(
  industry: ManagedAccountIndustry,
  year: number,
  month: number,
  documents: BookDocument[],
  payrollRecords: PayrollRecordForPnl[],
  revenueOverrides: PnlValueMap = {},
): IntegratedPnlInput {
  const values: PnlValueMap = {};
  const warnings: string[] = [];
  const targetPeriod = periodKey(year, month);
  const monthDocuments = documents.filter((document) => document.date?.slice(0, 7) === targetPeriod);

  let purchaseDocuments = 0;
  let salesDocuments = 0;
  let needsReviewDocuments = 0;

  for (const document of monthDocuments) {
    if (document.status === "Needs review") needsReviewDocuments += 1;

    if (document.documentType === "sales") {
      salesDocuments += 1;
      const revenueCode = firstCodeByGroup(linesForIndustry(industry), "revenue");
      if (revenueCode) add(values, revenueCode, Number(document.total || 0));
      continue;
    }

    purchaseDocuments += 1;
    const allocations = reconcileDocumentCategories(document);
    for (const allocation of allocations) {
      if (allocation.category === "Needs Review") {
        warnings.push(`${document.merchant || document.id}: purchase needs category review.`);
        continue;
      }
      if (allocation.category === "Equipment / Asset") {
        warnings.push(`${document.merchant || document.id}: asset purchase excluded from P&L until depreciation treatment is reviewed.`);
        continue;
      }
      const code = mapBookCategoryToCode(allocation.category, industry);
      if (!code) {
        warnings.push(`${document.merchant || document.id}: ${allocation.category} could not be mapped to this industry P&L.`);
        continue;
      }
      add(values, code, Number(allocation.amount || 0));
    }
  }

  const periodPayroll = payrollRecords.filter((record) => record.year === year && record.month === month);
  const issuedPayroll = periodPayroll.filter((record) => record.status === "issued" && record.isAdjustment !== true);
  const draftPayroll = periodPayroll.filter((record) => record.status !== "issued");
  const adjustmentPayroll = periodPayroll.filter((record) => record.isAdjustment === true);
  const payrollCode = defaultPayrollCode(industry);
  const payrollTotal = issuedPayroll.reduce((total, record) => total + grossEmploymentCost(record), 0);

  if (payrollCode && payrollTotal > 0) add(values, payrollCode, payrollTotal);
  if (draftPayroll.length) warnings.push(`${draftPayroll.length} payroll record(s) are still draft and excluded from the P&L.`);
  if (adjustmentPayroll.length) warnings.push(`${adjustmentPayroll.length} payroll adjustment record(s) require accountant review before posting.`);
  if (payrollAllocationSensitiveIndustries.includes(industry) && payrollTotal > 0) {
    warnings.push("Payroll is provisionally posted to operating staff cost. Allocate production/site/frontline labour separately before final close.");
  }

  for (const [code, amount] of Object.entries(revenueOverrides)) {
    if (typeof amount === "number" && Number.isFinite(amount)) values[code] = Math.round(amount * 100) / 100;
  }

  if (needsReviewDocuments > 0) warnings.push(`${needsReviewDocuments} WedgeBooks document(s) need review before month close.`);

  return {
    values,
    warnings: Array.from(new Set(warnings)),
    stats: {
      bookDocuments: monthDocuments.length,
      purchaseDocuments,
      salesDocuments,
      needsReviewDocuments,
      issuedPayrollRecords: issuedPayroll.length,
      draftPayrollRecords: draftPayroll.length,
    },
  };
}
