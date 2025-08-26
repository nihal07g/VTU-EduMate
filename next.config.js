/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Embed environment variables at build time for static export
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY, // Map GEMINI_API_KEY to NEXT_PUBLIC_GEMINI_API_KEY for compatibility
  },
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
          'process.env.NEXT_PUBLIC_GEMINI_API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_GEMINI_API_KEY),
          'process.env.GEMINI_API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_GEMINI_API_KEY)
        })
      );
    }
    return config;
  },
}

module.exports = nextConfig
