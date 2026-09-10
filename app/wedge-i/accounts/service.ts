import type { ManagedClient, MonthlyAccountFile, RestaurantSalesInput } from "./types";

type CreateManagedClientInput = Omit<ManagedClient, "businessId" | "createdAt" | "updatedAt" | "banks" | "employeeCount"> & {
  bankName?: string;
  bankLast4?: string;
};

function apiBaseUrl() {
  const value = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!value) throw new Error("API service is not configured.");
  return value;
}

function managerToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("wc_manager_token");
}

async function accountsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = managerToken();
  if (!token) throw new Error("Wedge operator session is required.");

  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || "Managed accounts request failed.");
  return data as T;
}

export function createManagedClient(input: CreateManagedClientInput) {
  return accountsRequest<{ success: true; client: ManagedClient }>("/api/managed-accounts/clients", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function loadManagedClients() {
  return accountsRequest<{ success: true; clients: ManagedClient[] }>("/api/managed-accounts/clients");
}

export function loadMonthlyAccountFile(businessId: string, year: number, month: number) {
  return accountsRequest<{ success: true; file: MonthlyAccountFile }>(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${year}-${String(month).padStart(2, "0")}`,
  );
}

export function saveRestaurantSales(businessId: string, year: number, month: number, sales: RestaurantSalesInput) {
  return accountsRequest(
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
  return accountsRequest(
    `/api/managed-accounts/clients/${encodeURIComponent(businessId)}/months/${year}-${String(month).padStart(2, "0")}/bank-statements`,
    { method: "POST", body: JSON.stringify(input) },
  );
}
