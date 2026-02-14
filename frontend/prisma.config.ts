// frontend/prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  datasource: {
    // Prisma v7 requires datasource.url in prisma.config.ts for migrate deploy
    url: process.env.DATABASE_URL,
  },
  migrations: {
    // Seed script (used by `npx prisma db seed`)
    seed: "npx tsx ./prisma/seed.ts",
  },
});
