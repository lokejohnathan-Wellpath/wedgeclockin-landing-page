export const MANAGED_ACCOUNT_INDUSTRIES = [
  "F&B - Restaurant / Cafe / QSR",
  "Bakery / Central Kitchen",
  "Retail",
  "Wholesale / Distribution",
  "E-commerce",
  "Beauty / Salon / Spa",
  "Automotive Workshop",
  "Clinic / Dental / Healthcare",
  "Professional Services",
  "Education / Training",
  "Hotel / Accommodation",
  "Property Rental / Management",
  "Construction / Renovation",
  "Manufacturing",
  "Logistics / Transport",
  "Agriculture / Aquaculture",
  "Trading / Import Export",
  "Technology / SaaS",
  "Agency / Events",
  "Cleaning / Security / Manpower",
  "Engineering / Maintenance",
  "Mining / Quarry / Materials",
  "Other SME",
] as const;

export type ManagedAccountIndustry = (typeof MANAGED_ACCOUNT_INDUSTRIES)[number];

export type ManagedAccountsSubscriptionStatus =
  | "pilot"
  | "active"
  | "paused"
  | "ended";

export type AccountsUserRole =
  | "owner"
  | "manager"
  | "accounts_contact"
  | "employee"
  | "accounts_executive"
  | "reviewer"
  | "founder_admin";

export type BankAccountRef = {
  id: string;
  bankName: string;
  accountLabel: string;
  last4: string;
  currency: "MYR" | string;
  active: boolean;
};

export type ManagedClient = {
  businessId: string;
  companyCode: string;
  legalName: string;
  tradingName?: string;
  registrationNumber: string;
  industry: ManagedAccountIndustry;
  financialYearEnd: string;
  sstRegistered: boolean;
  sstRegistrationNumber?: string;
  serviceChargeEnabled: boolean;
  ownerName: string;
  ownerEmail: string;
  ownerPhone?: string;
  assignedAccountsExecutive?: string;
  subscriptionStatus: ManagedAccountsSubscriptionStatus;
  subscriptionStartedAt: string;
  wedgeBooksEnabled: boolean;
  wedgeClockInEnabled: boolean;
  banks: BankAccountRef[];
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
};

export type MonthStepStatus =
  | "not_started"
  | "waiting_client"
  | "processing"
  | "review_required"
  | "ready"
  | "complete";

export type ReconciliationStatus =
  | "statement_missing"
  | "not_started"
  | "matching"
  | "exceptions"
  | "reconciled"
  | "closed";

export type MonthlyAccountFile = {
  id: string;
  businessId: string;
  year: number;
  month: number;
  sales: MonthStepStatus;
  documents: MonthStepStatus;
  payroll: MonthStepStatus;
  books: MonthStepStatus;
  bankReconciliation: ReconciliationStatus;
  review: MonthStepStatus;
  pnl: MonthStepStatus;
  missingDocumentCount: number;
  bankExceptionCount: number;
  reconciliationDifference: number;
  lockedAt?: string;
  lockedBy?: string;
};

export const MASTER_PNL_GROUPS = [
  "revenue",
  "direct_cost",
  "staff_cost",
  "occupancy",
  "utilities",
  "sales_marketing",
  "transport_logistics",
  "repairs_maintenance",
  "administration",
  "professional_technology",
  "depreciation",
  "other_operating_expense",
  "other_income",
  "finance_cost",
  "other_non_operating",
] as const;

export type MasterPnlGroup = (typeof MASTER_PNL_GROUPS)[number];

export type PnlAccountLine = {
  code: string;
  label: string;
  group: MasterPnlGroup;
};

export type IndustryPnlTemplate = {
  industry: ManagedAccountIndustry;
  revenueLines: PnlAccountLine[];
  directCostLines: PnlAccountLine[];
  operatingExpenseLines: PnlAccountLine[];
  kpis: string[];
  supportsRestaurantTenderBreakdown?: boolean;
};

export type RestaurantSalesInput = {
  foodSales: number;
  beverageSales: number;
  otherSales: number;
  serviceCharge: number;
  sst: number;
  cash: number;
  card: number;
  qr: number;
  grabFood: number;
  foodPanda: number;
  otherTender: number;
};

export type WorkQueueSeverity = "critical" | "attention" | "review";

export type AccountsWorkItem = {
  id: string;
  businessId: string;
  monthFileId: string;
  severity: WorkQueueSeverity;
  title: string;
  detail: string;
  assignedTo?: string;
  createdAt: string;
};
