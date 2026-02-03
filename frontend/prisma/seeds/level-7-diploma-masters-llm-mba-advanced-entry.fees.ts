import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../../src/generated/prisma/client";
import { upsertFees } from "./fee-helpers";

export async function seedLevel7Fees(prisma: PrismaClient) {
  const filePath = path.join(
    process.cwd(),
    "prisma",
    "data",
    "fees",
    "level-7-diploma-masters-llm-mba-advanced-entry.fees.json"
  );

  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  const res = await upsertFees(prisma, data);

  console.log(
    `✅ Level 7 fees: ${res.created} created, ${res.updated} updated, ${res.skipped} skipped (${res.read} rows read)`
  );

  return res;
}
