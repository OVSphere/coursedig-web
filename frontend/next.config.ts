import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
  turbopack: {},

  async redirects() {
    return [
      { source: "/main", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;

