import { API_BASE } from "@/lib/constants";
import { useAuthStore } from "@/stores/authStore";

export { API_BASE };

let refreshInFlight: Promise<boolean> | null = null;

function isAuthPath(path: string): boolean {
  return path.startsWith("/auth/");
}

async function refreshTokens(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = useAuthStore
      .getState()
      .refreshAccessToken()
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

async function doFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(init?.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
}

function handleUnauthorized(): never {
  useAuthStore.getState().clearAuth();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
  throw new Error("Unauthorized");
}

export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  let res = await doFetch(path, init);

  if (res.status !== 401 || isAuthPath(path)) {
    return res;
  }

  const refreshed = await refreshTokens();
  if (!refreshed) {
    handleUnauthorized();
  }

  res = await doFetch(path, init);
  if (res.status === 401) {
    handleUnauthorized();
  }

  return res;
}
