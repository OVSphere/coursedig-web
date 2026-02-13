import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // Optional but often helps with Prisma in server environments:
  // serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
