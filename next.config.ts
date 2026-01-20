/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",

  register: true,
  skipWaiting: true,

  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "https-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // يوم واحد
        },
      },
    },
  ],
});

const nextConfig = withPWA({
  reactStrictMode: true,

  experimental: {
    turbo: false,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true, // مهم للـ iOS
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.healthy.bond",
      },
    ],
  },
});

module.exports = nextConfig;
