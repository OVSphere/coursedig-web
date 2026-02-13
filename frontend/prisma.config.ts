// frontend/prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // Prisma 7: datasource URLs must live here (NOT in schema.prisma)
  datasource: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DATABASE_DIRECT_URL,
  },
});
