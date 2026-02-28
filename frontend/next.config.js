/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { 
        protocol: 'http', 
        hostname: 'localhost', 
        port: '9000', 
        pathname: '/**' 
      },
      { 
        protocol: 'https', 
        hostname: '**' // This allows ALL https images (be careful in production!)
      }
    ]
  },
  // This must be INSIDE the nextConfig object
  experimental: {
    allowedDevOrigins: [
      "http://165.232.102.141",
      "https://165.232.102.141",
      "http://mombasaunited.com",
      "https://mombasaunited.com",
      "http://www.mombasaunited.com",
      "https://www.mombasaunited.com",
    ],
  },
};

module.exports = nextConfig;