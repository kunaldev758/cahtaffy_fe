/** @type {import('next').NextConfig} */
const isProduction = process.env.APP_ENV === 'production';

const basePath = isProduction?'/chataffy/cahtaffy_fe':'';
const nextConfig = {
  reactStrictMode: false,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  experimental: {
    serverActions: {
        allowedOrigins: [
          "shopify.favseo.com",
          "localhost:9001",
          "127.0.0.1:9001",
          "34.213.132.47",
          "chataffy.com",
          "www.chataffy.com"
        ],
        bodySizeLimit: '20mb',
    },
  },
  images: {
    domains: ['localhost','34.213.132.47','chataffy.com','www.chataffy.com','flagcdn.com'],
  },
}

module.exports = nextConfig
