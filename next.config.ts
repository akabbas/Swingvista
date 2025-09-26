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
    // Handle Web Workers and MediaPipe compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };
    }
    
    // Handle MediaPipe ES modules
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });
    
    return config;
  },
  // Transpile MediaPipe packages
  transpilePackages: ['@mediapipe/pose'],
};

export default nextConfig;
