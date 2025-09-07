/** @type {import('next').NextConfig} */
const nextConfig = {
  // IMPORTANT: Do NOT set `output: 'export'`.
  // We want serverless/edge pages so API routes work on Vercel.
  reactStrictMode: true,
  trailingSlash: false,
  experimental: {
    typedRoutes: false,
  },
};

module.exports = nextConfig;
