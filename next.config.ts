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
