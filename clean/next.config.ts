import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
  },
  turbopack: {
    // Silence workspace-root inference warning in monorepo-ish setups
    root: __dirname,
  },
};

export default nextConfig;
