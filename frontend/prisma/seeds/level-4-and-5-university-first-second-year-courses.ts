// prisma/seeds/level-4-and-5-university-first-second-year-courses.ts
import path from "path";
import fs from "fs/promises";
import type { PrismaClient } from "@prisma/client";

type SeedStats = { read: number; created: number; updated: number; skipped?: number };

type CourseJson = {
  slug: string;
  title: string;
  category?: string | null;
  shortDescription?: string | null;
  overview: string;

  whoItsFor?: string | null;
  whatYoullLearn?: string | null;
  entryRequirements?: string | null;
  duration?: string | null;
  delivery?: string | null;
  startDatesNote?: string | null;
  priceNote?: string | null;

  heroImage?: string | null;
  imageAlt?: string | null;
};

const CATEGORY = "Level 4 & 5 – University First and Second Year Courses";

function toNull(v: any) {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}

function requiredString(v: any) {
  return String(v ?? "").trim();
}

async function readJsonFile<T>(relPathFromRepoRoot: string): Promise<T> {
  const filePath = path.join(process.cwd(), relPathFromRepoRoot);
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export default async function seedLevel45(prisma: PrismaClient): Promise<SeedStats> {
  const rows = await readJsonFile<CourseJson[]>(
    "prisma/data/level-4-and-5-university-first-second-year-courses.json"
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];

    const slug = requiredString(r.slug);
    const title = requiredString(r.title);
    const overview = requiredString(r.overview);

    if (!slug || !title || !overview) {
      skipped++;
      continue;
    }

    // ✅ Force consistent category for grouping + navigation
    const category = CATEGORY;

    const data = {
      title,
      category,
      shortDescription: toNull(r.shortDescription) ?? "View details and next steps.",
      overview,

      // ✅ Ensure these are persisted (create + update)
      whoItsFor: toNull(r.whoItsFor),
      whatYoullLearn: toNull(r.whatYoullLearn),

      entryRequirements: toNull(r.entryRequirements),
      duration: toNull(r.duration),
      delivery: toNull(r.delivery),
      startDatesNote: toNull(r.startDatesNote),
      priceNote: toNull(r.priceNote),

      heroImage: toNull(r.heroImage),
      imageAlt: toNull(r.imageAlt),

      // ✅ Make public pages work consistently
      published: true,
      sortOrder: i,
    };

    const existing = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });

    await prisma.course.upsert({
      where: { slug },
      create: { slug, ...data },
      update: { ...data },
    });

    if (existing) updated++;
    else created++;
  }

  return { read: rows.length, created, updated, skipped };
}
