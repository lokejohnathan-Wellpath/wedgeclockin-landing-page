import { clearProductToken, saveProductToken } from "./productAccess";

export const OWNER_TOKEN_KEY = "wedge_owner_token";

export type OwnerEntitlement = {
  enabled: boolean;
  status: string;
  activatedAt?: string | null;
};

export type OwnerBusiness = {
  businessId: string;
  companyCode: string;
  legalName: string;
  tradingName?: string;
  businessType: string;
  ownerName: string;
  ownerEmail: string;
  phone?: string;
  address?: string;
  status: string;
  assignedAccountsExecutive?: string;
  entitlements: {
    wedgeI: OwnerEntitlement;
    managedAccounts: OwnerEntitlement;
    books: OwnerEntitlement;
    clockIn: OwnerEntitlement;
  };
};

type ScopedAccess = {
  books: { token: string } | null;
  clockIn: {
    token: string;
    companyId: string;
    companyCode: string;
    companyName: string;
    managerId: string;
  } | null;
};

export type OwnerLoginResult = {
  success: true;
  token: string;
  business: OwnerBusiness;
  access: ScopedAccess;
};

export type OwnerSelectionRequired = {
  success: false;
  code: "BUSINESS_SELECTION_REQUIRED";
  message: string;
  businesses: Array<{ businessId: string; companyCode: string; name: string }>;
};

function apiBase() {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Wedge owner access service is not configured.");
  return base;
}

export function ownerToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(OWNER_TOKEN_KEY) || "";
}

export function saveOwnerToken(token: string) {
  localStorage.setItem(OWNER_TOKEN_KEY, token);
}

function saveScopedAccess(access: ScopedAccess) {
  if (access.books?.token) saveProductToken("books", access.books.token);
  else clearProductToken("books");

  if (access.clockIn) {
    localStorage.setItem("wc_manager_token", access.clockIn.token);
    localStorage.setItem("wc_company_id", access.clockIn.companyId);
    localStorage.setItem("wc_company_code", access.clockIn.companyCode);
    localStorage.setItem("wc_company_name", access.clockIn.companyName || "");
    localStorage.setItem("wc_manager_id", access.clockIn.managerId || "");
  } else {
    localStorage.removeItem("wc_manager_token");
    localStorage.removeItem("wc_company_id");
    localStorage.removeItem("wc_company_code");
    localStorage.removeItem("wc_company_name");
    localStorage.removeItem("wc_manager_id");
  }
}

export function clearOwnerSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(OWNER_TOKEN_KEY);
  clearProductToken("books");
  localStorage.removeItem("wc_manager_token");
  localStorage.removeItem("wc_company_id");
  localStorage.removeItem("wc_company_code");
  localStorage.removeItem("wc_company_name");
  localStorage.removeItem("wc_manager_id");
}

async function ownerRequest<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const token = ownerToken();
  const response = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && authenticated) clearOwnerSession();
  if (!response.ok) {
    const error = new Error(data?.message || "The request could not be completed.") as Error & { data?: unknown; status?: number };
    error.data = data;
    error.status = response.status;
    throw error;
  }
  return data as T;
}

export async function loginOwner(email: string, password: string, businessId?: string) {
  const response = await fetch(`${apiBase()}/api/owner/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, ...(businessId ? { businessId } : {}) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 409 && data?.code === "BUSINESS_SELECTION_REQUIRED") {
      return data as OwnerSelectionRequired;
    }
    throw new Error(data?.message || "Owner login failed.");
  }
  const result = data as OwnerLoginResult;
  saveOwnerToken(result.token);
  saveScopedAccess(result.access);
  return result;
}

export async function loadOwnerSession() {
  return ownerRequest<{ success: true; business: OwnerBusiness }>("/api/owner/auth/session");
}

export async function refreshOwnerProductAccess() {
  const result = await ownerRequest<{ success: true; business: OwnerBusiness; access: ScopedAccess }>("/api/owner/auth/access");
  saveScopedAccess(result.access);
  return result;
}

export async function ensureOwnerProductAccess(product: "books" | "clockIn") {
  if (!ownerToken()) return false;
  const result = await refreshOwnerProductAccess();
  if (product === "books") return Boolean(result.access.books?.token);
  return Boolean(result.access.clockIn?.token);
}

export async function ownerReportRequest<T>(path: string) {
  return ownerRequest<T>(`/api/owner/reports${path}`);
}

export async function ownerPasswordRequest<T>(path: string, body: Record<string, unknown>) {
  return ownerRequest<T>(`/api/owner/auth/password/${path}`, {
    method: "POST",
    body: JSON.stringify(body),
  }, false);
}
