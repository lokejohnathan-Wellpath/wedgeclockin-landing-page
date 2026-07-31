export const MANAGER_SESSION_KEYS = [
  "wc_manager_token",
  "wc_company_id",
  "wc_company_code",
  "wc_company_name",
  "wc_manager_id",
] as const;

export function clearManagerSession() {
  if (typeof window === "undefined") return;
  MANAGER_SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function expireManagerSession(response: Response) {
  if (response.status !== 401) return false;

  clearManagerSession();
  if (typeof window !== "undefined") {
    window.location.replace("/manager-login?reason=expired");
  }
  return true;
}
