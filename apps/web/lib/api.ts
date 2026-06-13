const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
let csrfToken: string | null = null;

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const response = await fetch(`${API_URL}/auth/csrf`, { credentials: "include" });
  if (!response.ok) throw new Error("Failed to fetch CSRF token");
  const payload = (await response.json()) as { csrfToken: string };
  csrfToken = payload.csrfToken;
  return csrfToken;
}

export function clearCsrfToken() {
  csrfToken = null;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const needsCsrf = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const csrfHeader = needsCsrf ? { "x-csrf-token": await getCsrfToken() } : {};

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...csrfHeader,
      ...(init.headers as Record<string, string> ?? {}),
    } as HeadersInit,
  });

  if (response.status === 401) {
    // Clear stale CSRF token on auth failure
    csrfToken = null;
    if (typeof window !== "undefined" && !path.includes("/auth/")) {
      window.location.href = "/login";
    }
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    let message: string;
    try {
      const body = await response.json();
      message = body?.message ?? body?.error ?? JSON.stringify(body);
    } catch {
      message = await response.text().catch(() => `Request failed: ${response.status}`);
    }
    throw new Error(message || `API request failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
