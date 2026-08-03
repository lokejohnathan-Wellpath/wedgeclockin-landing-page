import { customerSafeMessage } from "./customerMessages";

export type PaidProduct = "books" | "erp";

export type ProductSubscription = {
  status:
    | "TRIAL"
    | "TRIAL_EXPIRING"
    | "PAYMENT_REQUIRED"
    | "ACTIVE"
    | "PAST_DUE"
    | "SUSPENDED";
  trialStartedAt?: string;
  trialEndsAt?: string;
  daysRemaining: number;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  billingCycle?: "" | "monthly" | "annual";
  agreedPrice?: number;
  currency: "MYR";
  complimentaryAccess?: boolean;
  canWrite: boolean;
};

export const productConfig = {
  books: {
    name: "WedgeBooks",
    eyebrow: "AI BOOKKEEPING",
    basePath: "/wedge-i/books",
    tokenKey: "wedge_books_token",
    accent: "#b88a43",
  },
  erp: {
    name: "Wedge ERP/Supply",
    eyebrow: "SUPPLY OPERATIONS",
    basePath: "/wedge-supply",
    tokenKey: "wedge_erp_token",
    accent: "#5e8983",
  },
} as const;

export function productApiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Wedge Works access service is not configured.");
  return `${base}${path}`;
}

export function productToken(product: PaidProduct) {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(productConfig[product].tokenKey) || "";
}

export function saveProductToken(product: PaidProduct, token: string) {
  localStorage.setItem(productConfig[product].tokenKey, token);
}

export function clearProductToken(product: PaidProduct) {
  localStorage.removeItem(productConfig[product].tokenKey);
}

export async function productRequest<T>(
  product: PaidProduct,
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const token = productToken(product);
  const response = await fetch(productApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && authenticated && typeof window !== "undefined") {
    clearProductToken(product);
  }
  if (!response.ok) {
    throw new Error(
      customerSafeMessage(data?.message, "The request could not be completed."),
    );
  }
  return data as T;
}
