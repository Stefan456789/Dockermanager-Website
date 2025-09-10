/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/manager',
  assetPrefix: '/manager',
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
