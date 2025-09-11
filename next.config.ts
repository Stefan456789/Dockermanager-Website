/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
const assetPrefix = process.env.NEXT_PUBLIC_BASE_PATH;

const nextConfig = {
  basePath: basePath === '/' ? '' : basePath,
  assetPrefix: assetPrefix === '/' ? '' : assetPrefix,
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
