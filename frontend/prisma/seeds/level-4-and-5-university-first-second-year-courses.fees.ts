import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { upsertFees } from "./fee-helpers";

export async function seedLevel45Fees(prisma: PrismaClient) {
  const filePath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "fees",
    "level-4-and-5-university-first-second-year-courses.fees.json"
  );

  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  const res = await upsertFees(prisma, data);

  console.log(
    `✅ Level 4 & 5 fees: ${res.created} created, ${res.updated} updated, ${res.skipped} skipped (${res.read} rows read)`
  );

  return res;
}
