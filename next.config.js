/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    instrumentationHook: true,
  },
  images: {
    domains: ['lh3.googleusercontent.com'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
}

module.exports = nextConfig