import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizeCss: true,
  },
  // Remove standalone output for development
  // output: 'standalone',
  compiler: {
    // Keep console logs for debugging
    removeConsole: false,
  },
  webpack: (config, { isServer }) => {
    // Handle Web Workers
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
