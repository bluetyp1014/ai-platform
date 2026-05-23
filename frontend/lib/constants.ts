export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8003";

export const AUTH_STORAGE_KEY = "ai-platform-auth";

/** HttpOnly cookie name (set by backend; not readable from JS) */
export const REFRESH_TOKEN_COOKIE = "refresh_token";
