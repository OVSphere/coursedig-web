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

  // ✅ Fail fast (prevents accidental 127.0.0.1 / localhost attempts)
  if (!cs) {
    throw new Error(
      "Missing DATABASE_URL (or DATABASE_DIRECT_URL). Set it in your environment (Amplify / local .env)."
    );
  }

  return cs;
}

function shouldUseSsl(connectionString: string) {
  // Apply ssl config when sslmode indicates TLS (RDS commonly uses sslmode=require)
  return (
    connectionString.includes("sslmode=require") ||
    connectionString.includes("sslmode=verify-full") ||
    connectionString.includes("ssl=true") ||
    connectionString.includes("ssl=1")
  );
}

function makeClient() {
  const connectionString = resolveConnectionString();

  // ✅ Reuse pool across dev hot reload AND warm serverless invocations
  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new Pool({
      connectionString,
      max: 10,
      ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : undefined,
    });
  }

  const adapter = new PrismaPg(globalForPrisma.pgPool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = makeClient();
}

export const prisma = globalForPrisma.prisma;
