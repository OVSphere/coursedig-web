// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import seedVocational from "./seeds/vocational-training-professional-certificate-courses";
import seedLevel3 from "./seeds/level-3-university-entry-courses";
import seedLevel45 from "./seeds/level-4-and-5-university-first-second-year-courses";
import seedLevel7 from "./seeds/level-7-diploma-masters-llm-mba-advanced-entry";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set.");

const pool = new Pool({ connectionString, max: 5 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
