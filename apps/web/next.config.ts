import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep development chunks isolated from concurrent production builds.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
