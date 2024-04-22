import './src/lib/env/env.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/digimon-partner-kit',
  output: 'export',
  reactStrictMode: true,
  images: {
    minimumCacheTTL: 3600,
    domains: ['wikimon.net'],
  },
};

export default nextConfig;
