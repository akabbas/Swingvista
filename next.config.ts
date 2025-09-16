import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
  },
  turbopack: {
    // Silence workspace-root inference warning in monorepo-ish setups
    root: __dirname,
  },
  // Ensure CSS is loaded early
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
