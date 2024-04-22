import './src/lib/env/env.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/digimon-partner-kit',
  output: 'export', // <=== enables static exports
  reactStrictMode: true
};

export default nextConfig;
