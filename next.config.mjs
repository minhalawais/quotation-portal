/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['puppeteer']
  },
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true, // Added from updates
  },
  eslint: {
    ignoreDuringBuilds: true, // Added from updates
  },
  typescript: {
    ignoreBuildErrors: true, // Added from updates
  },
  // Optimize for Vercel deployment
  output: 'standalone',
  
  // Environment variables for build
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    MONGODB_URI: process.env.MONGODB_URI,
  },

  // Webpack configuration for Puppeteer
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('puppeteer')
    }
    return config
  },
}

export default nextConfig
