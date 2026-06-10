/** @type {import('next').NextConfig} */
const isProduction = process.env.APP_ENV === "production";

const nextConfig = {
  reactStrictMode: false,
  basePath: "",
  env: {
    NEXT_PUBLIC_BASE_PATH: "",
    NEXT_PUBLIC_MARKETING_URL:
      process.env.NEXT_PUBLIC_MARKETING_URL || "https://chataffy.com/",
    NEXT_PUBLIC_DASHBOARD_URL:
      process.env.NEXT_PUBLIC_DASHBOARD_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://dashboard.chataffy.com/",
    NEXT_PUBLIC_AGENT_URL:
      process.env.NEXT_PUBLIC_AGENT_URL || "https://agent.chataffy.com/",
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "shopify.favseo.com",
        "localhost:9001",
        "127.0.0.1:9001",
        "34.213.132.47",
        "chataffy.com",
        "www.chataffy.com",
        "dashboard.chataffy.com",
        "agent.chataffy.com",
      ],
      bodySizeLimit: "20mb",
    },
  },
  images: {
    domains: [
      "localhost",
      "34.213.132.47",
      "chataffy.com",
      "www.chataffy.com",
      "dashboard.chataffy.com",
      "agent.chataffy.com",
      "flagcdn.com",
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // {
          //   key: "Cross-Origin-Opener-Policy",
          //   value: "same-origin-allow-popups",
          // },
        ],
      },
      {
        source: "/openai/widget/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
      {
        source: "/widget-loader.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          { key: "Cache-Control", value: "public, max-age=3600" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/_api/widget-embed/:wid",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          { key: "Cache-Control", value: "public, max-age=3600" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
