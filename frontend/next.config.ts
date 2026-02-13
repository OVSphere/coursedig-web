import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // IMPORTANT: do NOT externalise Prisma in Amplify SSR
  experimental: {
    serverComponentsExternalPackages: [],
  },
  webpack: (config) => {
    // IMPORTANT: do NOT add prisma to externals
    return config;
  },
};

export default nextConfig;
