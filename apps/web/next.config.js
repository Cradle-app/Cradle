/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@dapp-forge/blueprint-schema'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;

