// frontend/src/lib/prisma-server.ts
// ✅ CourseDig: Server-only Prisma client using adapter-pg (Prisma 7 compatible)
// Fixes: Amplify SSR runtime DB env handling, stable pooling in prod + dev

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
 * Attempt to read DB vars from:
 * 1) Normal env vars (local/dev + some deploys)
 * 2) Amplify runtime secret injection (varies by deployment)
 */
function getDbEnv(): { DATABASE_URL?: string; DATABASE_DIRECT_URL?: string } {
  const envUrl = process.env.DATABASE_URL || undefined;
  const envDirect = process.env.DATABASE_DIRECT_URL || undefined;

  // Some Amplify setups expose secrets as a JSON blob in process.env.secrets
  // (Your build logs previously showed "Failed to set up process.env.secrets", but runtime may differ.)
  let secretsObj: any = null;
  const rawSecrets = process.env.secrets;
  if (rawSecrets) {
    try {
      secretsObj = JSON.parse(rawSecrets);
    } catch {
      // ignore parse errors
    }
  }

  // Also check for common alternative names some runtimes use
  // (harmless if not present)
  const altUrl =
    (process.env.AMPLIFY_DATABASE_URL as string | undefined) ||
    (process.env.DB_URL as string | undefined) ||
    (secretsObj?.DATABASE_URL as string | undefined);

  const altDirect =
    (process.env.AMPLIFY_DATABASE_DIRECT_URL as string | undefined) ||
    (process.env.DB_DIRECT_URL as string | undefined) ||
    (secretsObj?.DATABASE_DIRECT_URL as string | undefined);

  return {
    DATABASE_URL: envUrl || altUrl,
    DATABASE_DIRECT_URL: envDirect || altDirect,
  };
}

function getConnectionString() {
  const { DATABASE_DIRECT_URL, DATABASE_URL } = getDbEnv();
  const cs = DATABASE_DIRECT_URL || DATABASE_URL;

  if (!cs) {
    throw new Error(
      [
        "Missing DATABASE_URL (or DATABASE_DIRECT_URL) at runtime.",
        "Amplify SSR runtime is not injecting DB env vars.",
        "Fix: set DB vars in Hosting → Environment variables (build) AND ensure runtime can read them, or inject via supported secrets mechanism.",
      ].join(" ")
    );
  }

  return cs;
}

function shouldUseSsl(connectionString: string) {
  return (
    connectionString.includes("sslmode=require") ||
    connectionString.includes("sslmode=verify-full") ||
    connectionString.includes("sslmode=no-verify") ||
    connectionString.includes("ssl=true") ||
    connectionString.includes("ssl=1")
  );
}

function shouldRejectUnauthorized(connectionString: string) {
  // If you use sslmode=no-verify, we must disable CA verification.
  // If you later move to verify-full with proper CA bundle, change this.
  if (connectionString.includes("sslmode=no-verify")) return false;
  return false; // keep false for now to avoid cert-chain failures in Amplify runtime
}

export function getPrismaServer() {
  const connectionString = getConnectionString();

  if (!global.__coursedigPgPool) {
    global.__coursedigPgPool = new Pool({
      connectionString,
      max: 5,
      ssl: shouldUseSsl(connectionString)
        ? { rejectUnauthorized: shouldRejectUnauthorized(connectionString) }
        : undefined,
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
