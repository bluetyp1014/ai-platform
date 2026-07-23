import type { NextConfig } from "next";

const allowedDevOrigins = process.env.ALLOWED_DEV_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const configuredAppPrefix = process.env.NEXT_PUBLIC_BASE_PATH?.trim();
const appPrefix = configuredAppPrefix
  ? `/${configuredAppPrefix.replace(/^\/+|\/+$/g, "")}`
  : undefined;

const nextConfig: NextConfig = {
  basePath: appPrefix,
  allowedDevOrigins: allowedDevOrigins?.length
    ? allowedDevOrigins
    : undefined,
};

export default nextConfig;
