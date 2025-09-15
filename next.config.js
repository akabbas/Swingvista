const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable font optimization
  optimizeFonts: true,

  // Compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Configure webpack
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev && !isServer) {
      // Optimize chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxSize: 50000,
          cacheGroups: {
            // Critical CSS chunk
            critical: {
              name: 'critical',
              test: /\.(css|scss)$/,
              chunks: 'all',
              enforce: true,
              priority: 50,
            },
            // Common styles chunk
            styles: {
              name: 'styles',
              test: /\.(css|scss)$/,
              chunks: 'all',
              enforce: true,
              priority: 10,
            },
            // Vendor chunk
            vendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            // Default chunk
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
        minimize: true,
        runtimeChunk: {
          name: 'runtime',
        },
      };

      // Add CSS optimization plugins
      const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
      config.optimization.minimizer = [
        ...config.optimization.minimizer || [],
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
                normalizeWhitespace: true,
                minifyFontValues: true,
                minifyGradients: true,
              },
            ],
          },
        }),
      ];
    }

    return config;
  },
}

module.exports = withBundleAnalyzer(nextConfig);