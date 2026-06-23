/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'date-fns', 'exceljs'],
  },
  serverExternalPackages: ['@react-pdf/renderer'],
  images: {
    unoptimized: true,
  },
  turbopack: {},
  webpack: (config) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config
  },
};

module.exports = nextConfig;