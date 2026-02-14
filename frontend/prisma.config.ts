// frontend/prisma.config.ts
import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // ✅ Force Prisma to use THIS schema (prevents “wrong schema” generated client)
  schema: path.join(process.cwd(), "prisma", "schema.prisma"),

  // ✅ Needed for migrate dev / migrate deploy
  datasource: {
    url:
      process.env.DATABASE_URL ||
      process.env.DATABASE_DIRECT_URL ||
      (() => {
        throw new Error(
          "DATABASE_URL is missing. Set it in Amplify env vars (or .env.local) before running Prisma commands."
        );
      })(),
  },

  // ✅ Allows `npx prisma db seed`
  migrations: {
    seed: "npx tsx ./prisma/seed.ts",
  },
});
