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
  // Priority: DIRECT_URL (for migrations/pooling) > DATABASE_URL
  const cs = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;

  if (!cs) {
    // During the Next.js build phase, process.env might be temporarily empty.
    // We log a warning instead of crashing the entire build process.
    console.warn("⚠️ Warning: DATABASE_URL is not defined. Prisma may fail at runtime.");
    return ""; 
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

  // If we have no connection string and we're in production, we'll hit an error later.
  // But we allow it to initialize to prevent build-time crashes.
  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString: connectionString || undefined,
      max: 10,
      ssl: connectionString && shouldUseSsl(connectionString) 
        ? { rejectUnauthorized: false } 
        : undefined,
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

// Singleton pattern to prevent exhausting DB connections in SSR
export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}