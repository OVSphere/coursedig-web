import fs from "node:fs";
import path from "node:path";
import type { PrismaClient } from "@prisma/client";
import { upsertFees, type FeeRow } from "./fee-helpers";

export async function seedVocationalFees(prisma: PrismaClient) {
  const filePath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "fees",
    "vocational-training-professional-certificate-courses.fees.json"
  );

  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw) as { fees: FeeRow[] };

  const result = await upsertFees(prisma, data.fees);

  console.log(
    `✅ Vocational fees: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped (${result.read} rows read)`
  );

  return result;
}
