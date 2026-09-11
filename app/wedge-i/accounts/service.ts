import { founderRequest } from "../../lib/founderApi";
import type { BookDocument } from "../books/brain";
import type { PayrollRecordForPnl } from "./integration";
import type {
  ManagedAccountIndustry,
  ManagedAccountsSubscriptionStatus,
  ManagedClient,
  MonthlyAccountFile,
  RestaurantSalesInput,
} from "./types";

export type CreateManagedClientInput = {
  existingWedgeIBusinessId: string;
  industry?: ManagedAccountIndustry;
  financialYearEnd?: string;
  sstRegistered?: boolean;
  sstRegistrationNumber?: string;
  serviceChargeEnabled?: boolean;
  assignedAccountsExecutive?: string;
  subscriptionStatus?: ManagedAccountsSubscriptionStatus;
  subscriptionStartedAt?: string;
  bankName?: string;
  bankLast4?: string;
  legalName?: string;
  tradingName?: string;
  registrationNumber?: string;
  companyCode?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  wedgeBooksEnabled?: boolean;
  wedgeClockInEnabled?: boolean;
};

export type ManagedSourceData = {
  success: true;
  business: {
    businessId: string;
    companyCode: string;
    companyName: string;
    industry: string;
  };
  books: {
    connected: boolean;
    documents: BookDocument[];
  };
  clockIn: {
    connected: boolean;
    payroll: PayrollRecordForPnl[];
  };
};

function managedAccountsRequest<T>(path: string, init?: RequestInit) {
  return founderRequest<T>(path, init, true);
}

function period(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function createManagedClient(input: CreateManagedClientInput) {
  return managedAccountsRequest<{ success: true; client: ManagedClient }>("/api/managed-accounts/clients", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loadManagedClients() {
  return managedAccountsRequest<{ success: true; clients: ManagedClient[] }>("/api/managed-accounts/clients");
}

export function loadMonthlyAccountFile(businessId: string, year: number, month: number) {
  return managedAccountsRequest<{ success: true; file: MonthlyAccountFile }>(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${period(year, month)}`,
  );
}

export function loadManagedSourceData(businessId: string, year: number, month: number) {
  return managedAccountsRequest<ManagedSourceData>(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${period(year, month)}/source-data`,
  );
}

export function saveRestaurantSales(businessId: string, year: number, month: number, sales: RestaurantSalesInput) {
  return managedAccountsRequest(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${period(year, month)}/restaurant-sales`,
    { method: "PUT", body: JSON.stringify(sales) },
  );
}

export function uploadBankStatementMetadata(
  businessId: string,
  year: number,
  month: number,
  input: { bankAccountId: string; fileName: string; mimeType: string; base64?: string },
) {
  return managedAccountsRequest(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${period(year, month)}/bank-statements`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function saveManagedReconciliation(
  businessId: string,
  year: number,
  month: number,
  input: { reconciliationDifference: number; bankExceptionCount: number },
) {
  return managedAccountsRequest<{ success: true; file: MonthlyAccountFile }>(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${period(year, month)}/reconciliation`,
    { method: "PUT", body: JSON.stringify(input) },
  );
}

export function loadManagedPnlDraft(businessId: string, year: number, month: number) {
  return managedAccountsRequest<{
    success: true;
    pnl: { industry: string; values: Record<string, number>; warnings?: string[] } | null;
    status: string;
    closedAt?: string | null;
    closedBy?: string;
    file: MonthlyAccountFile;
  }>(`/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${period(year, month)}/pnl`);
}

export function saveManagedPnlDraft(
  businessId: string,
  year: number,
  month: number,
  input: { industry: string; values: Record<string, number>; warnings?: string[] },
) {
  return managedAccountsRequest(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${period(year, month)}/pnl`,
    { method: "PUT", body: JSON.stringify(input) },
  );
}

export function closeManagedAccountingMonth(
  businessId: string,
  year: number,
  month: number,
  reason?: string,
) {
  return managedAccountsRequest<{ success: true; file: MonthlyAccountFile; message: string }>(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${period(year, month)}/close`,
    { method: "POST", body: JSON.stringify({ reason: reason || "Month-end accounts approved and reconciled." }) },
  );
}
