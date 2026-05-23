import { create } from "zustand";
import { persist } from "zustand/middleware";

import { API_BASE, AUTH_STORAGE_KEY } from "@/lib/constants";

export type AccessTokenResponse = {
  access_token: string;
  token_type: string;
};

type AuthState = {
  accessToken: string | null;
  username: string | null;
  _hasHydrated: boolean;
  _sessionReady: boolean;
  setAccessToken: (accessToken: string, username?: string) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
  refreshAccessToken: () => Promise<boolean>;
  restoreSession: () => Promise<boolean>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
};

const authFetchInit: RequestInit = {
  credentials: "include",
};

let restoreInFlight: Promise<boolean> | null = null;

async function requestAccessToken(
  path: string,
  body?: Record<string, string>
): Promise<AccessTokenResponse> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...authFetchInit,
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail =
      typeof data.detail === "string" ? data.detail : "Request failed";
    throw new Error(detail);
  }
  return res.json() as Promise<AccessTokenResponse>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      username: null,
      _hasHydrated: false,
      _sessionReady: false,
      setAccessToken: (accessToken, username) =>
        set({
          accessToken,
          ...(username !== undefined ? { username } : {}),
        }),
      clearAuth: () => {
        void fetch(`${API_BASE}/auth/logout`, {
          ...authFetchInit,
          method: "POST",
        });
        set({ accessToken: null, username: null, _sessionReady: true });
      },
      setHasHydrated: (value) => set({ _hasHydrated: value }),
      refreshAccessToken: async () => {
        try {
          const data = await requestAccessToken("/auth/refresh");
          set({ accessToken: data.access_token, _sessionReady: true });
          return true;
        } catch {
          return false;
        }
      },
      restoreSession: async () => {
        if (restoreInFlight) {
          return restoreInFlight;
        }

        restoreInFlight = (async () => {
          const { accessToken } = get();
          if (accessToken) {
            set({ _sessionReady: true });
            return true;
          }

          const ok = await get().refreshAccessToken();
          set({ _sessionReady: true });
          return ok;
        })().finally(() => {
          restoreInFlight = null;
        });

        return restoreInFlight;
      },
      login: async (username, password) => {
        const data = await requestAccessToken("/auth/login", {
          username,
          password,
        });
        set({
          accessToken: data.access_token,
          username,
          _sessionReady: true,
        });
      },
      register: async (username, password) => {
        const data = await requestAccessToken("/auth/register", {
          username,
          password,
        });
        set({
          accessToken: data.access_token,
          username,
          _sessionReady: true,
        });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({
        accessToken: state.accessToken,
        username: state.username,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        void state?.restoreSession();
      },
    }
  )
);
