const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use Next's built-in font and CSS optimizations
  optimizeFonts: true,

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  experimental: {
    // Lightning CSS-based optimizations and critical CSS handling
    optimizeCss: true,
    serverActions: { bodySizeLimit: '2mb' },
  },

  // Avoid custom CSS chunk splitting which can delay first paint
  webpack: (config) => {
    return config;
  },
}

module.exports = withBundleAnalyzer(nextConfig);