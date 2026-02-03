import { PrismaClient } from "@prisma/client"; // Use standard import
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pgPool?: Pool;
};

function makeClient() {
  const connectionString = process.env.DATABASE_URL;
  
  // GUARD: During Next.js build, DATABASE_URL might be missing. 
  // We return a dummy client or just log it so the build doesn't crash.
  if (!connectionString) {
    console.warn("DATABASE_URL not found. Returning empty Prisma instance for build.");
    return new PrismaClient(); 
  }

  const pool = globalForPrisma.pgPool ?? new Pool({ connectionString, max: 10 });
  if (process.env.NODE_ENV !== "production") globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;