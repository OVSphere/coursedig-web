// frontend/src/lib/prisma.ts
import "server-only";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function resolveConnectionString() {
  const cs = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;

  if (!cs) {
    throw new Error(
      "Missing DATABASE_URL (or DATABASE_DIRECT_URL). Set it in Amplify env vars (and local .env when running locally)."
    );
  }

  return cs;
}

function shouldUseSsl(connectionString: string) {
  return (
    connectionString.includes("sslmode=require") ||
    connectionString.includes("sslmode=verify-full") ||
    connectionString.includes("ssl=true") ||
    connectionString.includes("ssl=1")
  );
}

function makeClient() {
  const connectionString = resolveConnectionString();

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      max: 10,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.pgPool = pool;
  }

  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
