// frontend/src/lib/prisma-server.ts
// ✅ CourseDig: Server-only Prisma client using adapter-pg (Prisma 7 compatible)
// Fixes: runtime DB env handling (no localhost fallback), stable pooling in prod + dev

import "server-only";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __coursedigPrisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __coursedigPgPool: Pool | undefined;
}

/**
 * Prefer DIRECT_URL when available (useful for migrations/seed),
 * otherwise use DATABASE_URL for runtime.
 * Never fall back to localhost.
 */
function getConnectionString() {
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

export function getPrismaServer() {
  const connectionString = getConnectionString();

  /**
   * Always reuse pool/client across invocations when possible.
   * - In production (Amplify SSR/Lambda), reuse globals to avoid opening new connections per request.
   * - In dev, reuse globals to survive hot reload.
   */
  if (!global.__coursedigPgPool) {
    global.__coursedigPgPool = new Pool({
      connectionString,
      max: 5,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    });
  }

  if (!global.__coursedigPrisma) {
    const adapter = new PrismaPg(global.__coursedigPgPool);
    global.__coursedigPrisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return { prisma: global.__coursedigPrisma, pool: global.__coursedigPgPool };
}
