import './src/lib/env/env.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/digimon-partner-kit',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/digimon-partner-kit/' : '',
  reactStrictMode: true,
  images: {
    unoptimized: true,
    minimumCacheTTL: 3600,
    domains: ['wikimon.net'],
  },
};

export default nextConfig;
