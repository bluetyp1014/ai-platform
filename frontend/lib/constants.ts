export const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export const APP_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const AUTH_STORAGE_KEY = "ai-platform-auth";

/** HttpOnly cookie name (set by backend; not readable from JS) */
export const REFRESH_TOKEN_COOKIE = "ai_platform_refresh_token";
