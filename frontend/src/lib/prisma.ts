// frontend/src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function makeClient() {
  // Prefer direct URL if set (recommended), otherwise fallback.
  const connectionString =
    process.env.DATABASE_DIRECT_URL ||
    process.env.DATABASE_URL ||
    "postgresql://invalid:invalid@localhost:5432/invalid?schema=public";

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      max: 10,

      // Important for AWS RDS + many hosted Postgres providers.
      // Prevents TLS handshake failures when certificates aren’t validated by the runtime.
      ssl:
        connectionString.includes("sslmode=require") ||
        connectionString.includes("sslmode=verify-full")
          ? { rejectUnauthorized: false }
          : undefined,
    });

  // Reuse the pool in dev/hot reload
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
