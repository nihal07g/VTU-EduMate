/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Embed environment variables at build time for static export
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
      
      // Replace environment variables at build time
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY)
        })
      );
    }
    return config;
  },
}

module.exports = nextConfig
