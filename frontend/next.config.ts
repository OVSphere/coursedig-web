import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Next 16: moved from experimental.serverComponentsExternalPackages
  serverExternalPackages: ["@prisma/client"],

  // Optional: keep an empty turbopack config to avoid noisy warnings
  turbopack: {},
};

export default nextConfig;
