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
  async headers() {
    return [
      {
        // Allow the widget page to be embedded as an iframe on any external site
        source: '/openai/widget/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'ALLOWALL' },
          { key: 'Content-Security-Policy', value: "frame-ancestors *" },
        ],
      },
      {
        // Serve the loader script with explicit JS content-type (browsers expect
        // application/javascript for <script src>, not text/html)
        source: '/widget-loader.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
}

module.exports = nextConfig
