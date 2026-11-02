import './src/lib/env/env.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/digimon-partner-kit',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/digimon-partner-kit/' : '',
  reactStrictMode: true,
  images: {
    unoptimized: true,
    minimumCacheTTL: 3600,
    remotePatterns: [
      {
          protocol:"https",
          hostname:"wikimon.net",
          pathname:"/**"
      }
    ],
  },
};

export default nextConfig;
