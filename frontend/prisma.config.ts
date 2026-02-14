// frontend/prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  migrations: {
    // Runs the existing TS seed script at frontend/prisma/seed.ts
    // Uses tsx so TypeScript imports work reliably.
    seed: "npx tsx ./prisma/seed.ts",
  },
});
