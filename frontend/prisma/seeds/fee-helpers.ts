// frontend/prisma/seeds/fee-helpers.ts
import type { PrismaClient } from "@prisma/client";

export type FeeRow = {
  courseSlug: string;
  level: "VOCATIONAL" | "LEVEL3" | "LEVEL4_5" | "LEVEL7";
  amountPence: number;
  currency?: string;
  payInFullAvailable?: boolean;
  payInFullDiscountPercent?: number;
  note?: string;
  isActive?: boolean;
};

// ✅ NEW: fallback slug normaliser for old fee slugs like "...-vocational"
function normaliseFeeCourseSlug(slug: string) {
  const s = String(slug || "").trim();
  if (!s) return s;
  if (s.endsWith("-vocational")) return s.slice(0, -"-vocational".length);
  return s;
}

export async function upsertFees(prisma: PrismaClient, feesInput: unknown) {
  const fees: FeeRow[] = Array.isArray(feesInput)
    ? (feesInput as FeeRow[])
    : ((feesInput as any)?.fees as FeeRow[]);

  if (!Array.isArray(fees)) {
    throw new Error(
      "Invalid fee JSON shape. Expected { fees: FeeRow[] } or FeeRow[]."
    );
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of fees) {
    const originalSlug = String(row.courseSlug || "").trim();
    if (!originalSlug) {
      skipped++;
      continue;
    }

    // ✅ NEW: try exact slug first, then fallback (remove -vocational)
    const candidateSlugs = [originalSlug];
    const fallback = normaliseFeeCourseSlug(originalSlug);
    if (fallback && fallback !== originalSlug) candidateSlugs.push(fallback);

    let course: { id: string } | null = null;

    for (const s of candidateSlugs) {
      course = await prisma.course.findUnique({
        where: { slug: s },
        select: { id: true },
      });
      if (course) break;
    }

    if (!course) {
      console.warn(`⚠️ Fee skipped — course not found for slug: ${originalSlug}`);
      skipped++;
      continue;
    }

    // ✅ Accurate created vs updated
    const existingFee = await prisma.courseFee.findUnique({
      where: { courseId: course.id },
      select: { id: true },
    });

    if (existingFee) {
      await prisma.courseFee.update({
        where: { courseId: course.id },
        data: {
          level: row.level,
          amountPence: row.amountPence,
          currency: row.currency ?? "GBP",
          payInFullAvailable: row.payInFullAvailable ?? true,
          payInFullDiscountPercent: row.payInFullDiscountPercent ?? 10,
          note: row.note ?? null,
          isActive: row.isActive ?? true,
        },
      });
      updated++;
    } else {
      await prisma.courseFee.create({
        data: {
          courseId: course.id,
          level: row.level,
          amountPence: row.amountPence,
          currency: row.currency ?? "GBP",
          payInFullAvailable: row.payInFullAvailable ?? true,
          payInFullDiscountPercent: row.payInFullDiscountPercent ?? 10,
          note: row.note ?? null,
          isActive: row.isActive ?? true,
        },
      });
      created++;
    }
  }

  return { created, updated, skipped, read: fees.length };
}
