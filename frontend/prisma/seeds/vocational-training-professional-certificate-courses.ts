import type { PrismaClient } from "@prisma/client";
import { readJsonArray } from "./_helpers";

type CourseRow = {
  slug?: string;
  title: string;

  shortDescription?: string;
  overview?: string;

  whoItsFor?: string;
  whatYoullLearn?: string;

  delivery?: string;
  duration?: string;
  entryRequirements?: string;
  startDatesNote?: string;
  priceNote?: string;
  heroImage?: string;
  imageAlt?: string;
};

export type SeedResult = { read: number; created: number; updated: number };

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clean(v: unknown) {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : null;
}

export default async function seedVocationalTraining(
  prisma: PrismaClient
): Promise<SeedResult> {
  const category = "Vocational Training / Professional Certificate Courses";

  const courses = readJsonArray<CourseRow>(
    "data/vocational-training-professional-certificate-courses.json"
  );

  let created = 0;
  let updated = 0;

  for (let i = 0; i < courses.length; i++) {
    const c = courses[i];

    const title = String(c?.title ?? "").trim();
    if (!title) continue;

    const slug = String(c?.slug ?? slugify(title)).trim();
    if (!slug) continue;

    const data = {
      title,
      slug,
      category,

      shortDescription:
        clean(c.shortDescription) ?? "View details and next steps.",

      // REQUIRED by schema
      overview:
        clean(c.overview) ??
        `Full details for ${title} will be published shortly.`,

      whoItsFor: clean(c.whoItsFor),
      whatYoullLearn: clean(c.whatYoullLearn),

      delivery: clean(c.delivery),
      duration: clean(c.duration),
      entryRequirements: clean(c.entryRequirements),
      startDatesNote: clean(c.startDatesNote),
      priceNote: clean(c.priceNote),

      heroImage: clean(c.heroImage),
      imageAlt: clean(c.imageAlt),

      published: true,
      sortOrder: i,
    };

    await prisma.course.upsert({
      where: { slug },
      update: data,
      create: data,
    });

    // upsert doesn't tell created vs updated, so count by checking existence first
    // (lightweight approach: keep as "updated" for re-runs)
    updated++;
  }

  // Better stats: treat all as updated (safe), your console already confirms rows
  return { read: courses.length, created, updated };
}
