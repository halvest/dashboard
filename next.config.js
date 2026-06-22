/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    // Hapus rule .mjs yang lama
    // config.module.rules.push({
    //   test: /.*\.mjs$/,
    //   type: "javascript/auto",
    //   resolve: {
    //     fullySpecified: false,
    //   },
    // });

    return config
  },
};

module.exports = nextConfig;