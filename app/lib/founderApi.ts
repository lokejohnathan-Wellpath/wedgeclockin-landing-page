export const FOUNDER_TOKEN_KEY = "wedge_founder_control_token";

export function founderApiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("Founder API is not configured.");
  return `${base}${path}`;
}

export async function founderRequest<T>(
  path: string,
  init: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const token =
    typeof window === "undefined"
      ? ""
      : localStorage.getItem(FOUNDER_TOKEN_KEY) || "";
  const response = await fetch(founderApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(authenticated && token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Correlation-Id": crypto.randomUUID(),
      ...init.headers,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && authenticated && typeof window !== "undefined") {
    localStorage.removeItem(FOUNDER_TOKEN_KEY);
  }
  if (!response.ok) throw new Error(data?.message || "Founder request failed.");
  return data as T;
}
