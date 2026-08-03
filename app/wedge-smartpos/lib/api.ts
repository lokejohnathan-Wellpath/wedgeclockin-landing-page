import { customerSafeMessage } from "../../lib/customerMessages";

export const SMARTPOS_TOKEN_KEY = "wedge_smartpos_token";

export function smartPosApiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Wedge-SmartPOS is being connected. Please try again shortly.");
  return `${base}${path}`;
}

export async function smartPosRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = typeof window === "undefined" ? "" : localStorage.getItem(SMARTPOS_TOKEN_KEY);
  const isPublicRequest =
    path.startsWith("/api/smartpos/auth/") ||
    path.startsWith("/api/smartpos/public/");
  const response = await fetch(smartPosApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(!isPublicRequest && token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && !isPublicRequest && typeof window !== "undefined") {
    localStorage.removeItem(SMARTPOS_TOKEN_KEY);
    window.location.replace("/wedge-smartpos/login?reason=expired");
    throw new Error("Your session has expired. Please log in again.");
  }
  if (!response.ok) {
    throw new Error(
      customerSafeMessage(data?.message, "We could not complete that request."),
    );
  }
  return data as T;
}

export type SmartPosPlan = {
  monthlyPrice: number;
  annualPrice: number;
  currency: "MYR";
  defaultTrialDays: number;
};

export type SmartPosSubscription = {
  status: "TRIAL" | "TRIAL_EXPIRING" | "PAYMENT_REQUIRED" | "ACTIVE" | "PAST_DUE" | "SUSPENDED";
  trialEndsAt?: string;
  daysRemaining?: number;
  currentPeriodEnd?: string;
};
