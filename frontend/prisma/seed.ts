// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import seedVocational from "./seeds/vocational-training-professional-certificate-courses";
import seedLevel3 from "./seeds/level-3-university-entry-courses";
import seedLevel45 from "./seeds/level-4-and-5-university-first-second-year-courses";
import seedLevel7 from "./seeds/level-7-diploma-masters-llm-mba-advanced-entry";

import { seedVocationalFees } from "./seeds/vocational-training-professional-certificate-courses.fees";
import { seedLevel3Fees } from "./seeds/level-3-university-entry-courses.fees";
import { seedLevel45Fees } from "./seeds/level-4-and-5-university-first-second-year-courses.fees";
import { seedLevel7Fees } from "./seeds/level-7-diploma-masters-llm-mba-advanced-entry.fees";

type SeedStats = {
  read: number;
  created: number;
  updated: number;
  skipped?: number;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const pool = new Pool({ connectionString, max: 5 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function normaliseStats(result: unknown, fallbackRead = 0): SeedStats {
  // If a seed script forgot to return stats, don’t crash the whole seed.
  if (!result || typeof result !== "object") {
    return { read: fallbackRead, created: 0, updated: 0, skipped: fallbackRead };
  }

  const r = result as Partial<SeedStats>;
  return {
    read: Number(r.read ?? fallbackRead),
    created: Number(r.created ?? 0),
    updated: Number(r.updated ?? 0),
    skipped: r.skipped == null ? undefined : Number(r.skipped),
  };
}

async function main() {
  console.log("🌱 Seeding courses...");

  const v = await seedVocational(prisma);
  console.log(`Vocational seeded: ${v.created} created, ${v.updated} updated (${v.read} rows read)`);

  const l3 = await seedLevel3(prisma);
  console.log(`Level 3 seeded: ${l3.created} created, ${l3.updated} updated (${l3.read} rows read)`);

  const l45 = await seedLevel45(prisma);
  console.log(`Level 4 & 5 seeded: ${l45.created} created, ${l45.updated} updated (${l45.read} rows read)`);

  const l7 = await seedLevel7(prisma);
  console.log(`Level 7 seeded: ${l7.created} created, ${l7.updated} updated (${l7.read} rows read)`);

  console.log("💷 Seeding course fees...");

  const fvRaw = await seedVocationalFees(prisma);
  const fv = normaliseStats(fvRaw, 0);
  console.log(`Vocational fees: ${fv.created} created, ${fv.updated} updated (${fv.read} rows read)`);

  const fl3Raw = await seedLevel3Fees(prisma);
  const fl3 = normaliseStats(fl3Raw, 0);
  console.log(`Level 3 fees: ${fl3.created} created, ${fl3.updated} updated (${fl3.read} rows read)`);

  const fl45Raw = await seedLevel45Fees(prisma);
  const fl45 = normaliseStats(fl45Raw, 0);
  console.log(`Level 4 & 5 fees: ${fl45.created} created, ${fl45.updated} updated (${fl45.read} rows read)`);

  const fl7Raw = await seedLevel7Fees(prisma);
  const fl7 = normaliseStats(fl7Raw, 0);
  console.log(`Level 7 fees: ${fl7.created} created, ${fl7.updated} updated (${fl7.read} rows read)`);

  console.log("✅ All seeds complete");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
