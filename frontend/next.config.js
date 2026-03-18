/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    unoptimized: true, // ⚠️ disables Next.js image optimization completely
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mombasaunited.com',
        pathname: '/club-media/**', // only your MinIO bucket path
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**', // for dev
      },
      {
        protocol: 'https',
        hostname: 'apifootball.akilimatic.com',
      },
    ],
  },

  experimental: {
    allowedDevOrigins: [
      "http://165.232.102.141",
      "https://165.232.102.141",
      "http://mombasaunited.com",
      "https://mombasaunited.com",
      "http://www.mombasaunited.com",
      "https://www.mombasaunited.com",
      "https://apifootball.akilimatic.com",
    ],
  },
};

module.exports = nextConfig;