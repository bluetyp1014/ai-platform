import { APP_BASE_PATH } from "@/lib/constants";

function normalizeBasePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/g, "")}`;
}

function currentBasePath(): string {
  const configured = normalizeBasePath(APP_BASE_PATH);
  if (configured) return configured;

  if (typeof window !== "undefined") {
    const { pathname } = window.location;
    if (pathname === "/ai" || pathname.startsWith("/ai/")) {
      return "/ai";
    }
  }

  return "";
}

export function appPath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const basePath = currentBasePath();

  if (!basePath || normalizedPath === basePath || normalizedPath.startsWith(`${basePath}/`)) {
    return normalizedPath;
  }

  return normalizedPath === "/" ? `${basePath}/` : `${basePath}${normalizedPath}`;
}

export function appRoutePath(pathname: string): string {
  const basePath = currentBasePath();
  if (basePath && (pathname === basePath || pathname.startsWith(`${basePath}/`))) {
    return pathname.slice(basePath.length) || "/";
  }
  return pathname;
}

export function redirectToAppPath(path: string): never {
  if (typeof window !== "undefined") {
    window.location.replace(appPath(path));
  }

  throw new Error("Redirecting");
}
