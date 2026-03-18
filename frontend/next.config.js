/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    formats: ['image/avif', 'image/webp'], // ✅ enable modern formats

    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },

      // 🔥 your production MinIO / CDN domain (REPLACE THIS)
      {
        protocol: 'https',
        hostname: 'your-minio-domain.com',
        pathname: '/**',
      },

      // optional: your API domain if it serves images
      {
        protocol: 'https',
        hostname: 'apifootball.akilimatic.com',
        //pathname: '/**',
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