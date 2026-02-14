// frontend/src/lib/prisma-server.ts
// ✅ CourseDig: Server-only Prisma client using adapter-pg (Prisma 7 compatible)
// Fixes: runtime DB env handling (no localhost fallback), stable pooling in prod + dev

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
      "DATABASE_URL/DATABASE_DIRECT_URL is missing (required for Prisma server client). Check Amplify env vars."
    );
  }
  return cs;
}

export function getPrismaServer() {
  const connectionString = getConnectionString();

  /**
   * Always reuse pool/client across invocations when possible.
   * - In production (Amplify SSR/Lambda), reuse globals to avoid opening new connections per request.
   * - In dev, reuse globals to survive hot reload.
   */
  if (!global.__coursedigPgPool) {
    global.__coursedigPgPool = new Pool({ connectionString, max: 5 });
  }

  if (!global.__coursedigPrisma) {
    const adapter = new PrismaPg(global.__coursedigPgPool);
    global.__coursedigPrisma = new PrismaClient({ adapter });
  }

  return { prisma: global.__coursedigPrisma, pool: global.__coursedigPgPool };
}
