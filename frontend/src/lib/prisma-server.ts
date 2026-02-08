// frontend/src/lib/prisma-server.ts
// ✅ NEW (CourseDig): Server-only Prisma client using adapter-pg (Prisma 7 compatible)

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __coursedigPrisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __coursedigPgPool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing (required for Prisma server client).");
}

export function getPrismaServer() {
  if (process.env.NODE_ENV === "production") {
    const pool = new Pool({ connectionString, max: 5 });
    const adapter = new PrismaPg(pool);
    return { prisma: new PrismaClient({ adapter }), pool };
  }

  if (!global.__coursedigPgPool) {
    global.__coursedigPgPool = new Pool({ connectionString, max: 5 });
  }

  if (!global.__coursedigPrisma) {
    const adapter = new PrismaPg(global.__coursedigPgPool);
    global.__coursedigPrisma = new PrismaClient({ adapter });
  }

  return { prisma: global.__coursedigPrisma, pool: global.__coursedigPgPool };
}
