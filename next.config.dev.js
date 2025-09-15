/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable all optimizations in development
  optimizeFonts: false,
  swcMinify: false,
  compress: false,
  reactStrictMode: false,
  
  // Minimal webpack config for development
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable optimization in development
      config.optimization = {
        minimize: false,
        minimizer: [],
        moduleIds: 'named',
        splitChunks: false,
        runtimeChunk: false
      };

      // Remove unnecessary plugins in development
      config.plugins = config.plugins.filter(plugin => {
        return !plugin.constructor.name.includes('Mini') && 
               !plugin.constructor.name.includes('Optimize') &&
               !plugin.constructor.name.includes('Terser');
      });
    }
    return config;
  }
};

module.exports = nextConfig;

