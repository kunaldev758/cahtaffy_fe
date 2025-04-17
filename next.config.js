/** @type {import('next').NextConfig} */
const isProduction = process.env.APP_ENV === 'production';
const isDevelopment = process.env.APP_ENV === 'development';

// const assetPrefix = isDevelopment ? 'https://shopify.favseo.com/chataffy/frontend' : undefined;
console.log('isProduction', isProduction);
console.log('isDevelopment', isDevelopment);
console.log('APP_ENV', process.env.APP_ENV);
const basePath = isDevelopment ? '/chataffy/frontend' : '/chataffy/cahtaffy_fe';
const nextConfig = {
  reactStrictMode: false,
  // assetPrefix,
  basePath,
  experimental: {
    serverActions: {
        allowedOrigins: ["shopify.favseo.com","localhost:9001","127.0.0.1:9001","34.213.132.47"],
    },
  },
  images: {
    domains: ['localhost','34.213.132.47'], // Add 'localhost' to allowed domains
  },
}

module.exports = nextConfig
