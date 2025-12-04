/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  },
  images: {
    unoptimized: true, // For Railway.io deployment
  },
  output: 'standalone', // For Railway.io deployment
};

module.exports = nextConfig;