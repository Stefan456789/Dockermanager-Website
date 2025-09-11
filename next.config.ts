/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: process.env.BASE_PATH || '/',
  assetPrefix: process.env.BASE_PATH || '/',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
