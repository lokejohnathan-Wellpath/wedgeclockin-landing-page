import { founderRequest } from "../../lib/founderApi";
import type { ManagedClient, MonthlyAccountFile, RestaurantSalesInput } from "./types";

type CreateManagedClientInput = Omit<ManagedClient, "businessId" | "createdAt" | "updatedAt" | "banks" | "employeeCount"> & {
  bankName?: string;
  bankLast4?: string;
};

function managedAccountsRequest<T>(path: string, init?: RequestInit) {
  return founderRequest<T>(path, init, true);
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
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${year}-${String(month).padStart(2, "0")}`,
  );
}

export function saveRestaurantSales(businessId: string, year: number, month: number, sales: RestaurantSalesInput) {
  return managedAccountsRequest(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${year}-${String(month).padStart(2, "0")}/restaurant-sales`,
    { method: "PUT", body: JSON.stringify(sales) },
  );
}

export function uploadBankStatementMetadata(
  businessId: string,
  year: number,
  month: number,
  input: { bankAccountId: string; fileName: string; mimeType: string; base64: string },
) {
  return managedAccountsRequest(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${year}-${String(month).padStart(2, "0")}/bank-statements`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function loadManagedPnlDraft(businessId: string, year: number, month: number) {
  return managedAccountsRequest(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${year}-${String(month).padStart(2, "0")}/pnl`,
  );
}

export function saveManagedPnlDraft(
  businessId: string,
  year: number,
  month: number,
  input: { industry: string; values: Record<string, number>; warnings?: string[] },
) {
  return managedAccountsRequest(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${year}-${String(month).padStart(2, "0")}/pnl`,
    { method: "PUT", body: JSON.stringify(input) },
  );
}

export function closeManagedAccountingMonth(
  businessId: string,
  year: number,
  month: number,
  reason?: string,
) {
  return managedAccountsRequest(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${year}-${String(month).padStart(2, "0")}/close`,
    { method: "POST", body: JSON.stringify({ reason: reason || "Month-end accounts approved and reconciled." }) },
  );
}
