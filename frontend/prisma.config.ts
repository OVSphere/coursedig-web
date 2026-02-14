import { defineConfig } from "prisma/config";
import dotenv from "dotenv";
import path from "path";

// Ensure env vars are loaded when Prisma reads this config
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
