/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
  // This is important - prevents Prisma from connecting during build
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
