import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
  },
  // Disable turbopack in production
  ...(process.env.NODE_ENV === 'production' ? {} : {
    turbopack: {
      root: __dirname,
    }
  }),
  output: 'standalone',
  compiler: {
    // Keep console logs for debugging
    removeConsole: false,
  },
};

export default nextConfig;
