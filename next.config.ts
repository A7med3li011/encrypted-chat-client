/** @type {import('next').NextConfig} */
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // يعمل PWA فقط في الإنتاج
});

const nextConfig = withPWA({
  reactStrictMode: true,
  experimental: {
    turbo: false, // تعطيل Turbopack
  },
  typescript: {
    ignoreBuildErrors: true,
  },
});

module.exports = nextConfig;
