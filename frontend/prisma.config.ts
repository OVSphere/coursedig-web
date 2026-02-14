// frontend/prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // ✅ Needed for migrate dev / migrate deploy
  datasource: {
    url: process.env.DATABASE_URL,
  },

  // ✅ Allows `npx prisma db seed`
  migrations: {
    seed: "npx tsx ./prisma/seed.ts",
  },
});
