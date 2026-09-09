import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const monorepoRoot = fileURLToPath(new URL("../..", import.meta.url));
const apiProxyOrigin = process.env.API_PROXY_ORIGIN?.replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Keep development chunks isolated from concurrent production builds.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  async rewrites() {
    if (!apiProxyOrigin) return [];

    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyOrigin}/api/:path*`,
      },
      { source: "/health", destination: `${apiProxyOrigin}/health` },
      { source: "/ready", destination: `${apiProxyOrigin}/ready` },
    ];
  },
};

export default nextConfig;
