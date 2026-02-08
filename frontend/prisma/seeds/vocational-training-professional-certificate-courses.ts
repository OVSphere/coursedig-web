// prisma/seeds/vocational-training-professional-certificate-courses.ts
import type { PrismaClient } from "../../src/generated/prisma/client";
import { readJsonArray } from "./_helpers";

type CourseRow = {
  slug?: string; // ✅ NEW: optional (your JSON doesn't include slug)
  title: string;

  shortDescription?: string;
  overview?: string;

  whoItsFor?: string; // ✅ NEW: your JSON includes this
  whatYoullLearn?: string; // ✅ NEW: your JSON includes this

  delivery?: string;
  duration?: string;
  entryRequirements?: string;
  startDatesNote?: string;
  priceNote?: string;
  heroImage?: string;
  imageAlt?: string;
};

export type SeedResult = { read: number; created: number; updated: number };

// ✅ NEW: generate slug from title when slug is missing
function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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

    // ✅ NEW: require title (slug can be generated)
    const title = String(c?.title ?? "").trim();
    if (!title) continue;

    // ✅ NEW: generate slug if missing
    const slug = String(c.slug ?? slugify(title)).trim();
    if (!slug) continue;

    const exists = await prisma.course.findUnique({
      where: { slug },
      select: { id: true },
    });

    const data = {
      title,
      category,
      shortDescription: c.shortDescription ?? "View details and next steps.",
      overview: c.overview ?? `Full details for ${title} will be published shortly.`,

      // ✅ NEW: persist JSON fields to DB (schema supports them)
      whoItsFor: c.whoItsFor ?? null,
      whatYoullLearn: c.whatYoullLearn ?? null,

      delivery: c.delivery ?? null,
      duration: c.duration ?? null,
      entryRequirements: c.entryRequirements ?? null,
      startDatesNote: c.startDatesNote ?? null,
      priceNote: c.priceNote ?? null,
      heroImage: c.heroImage ?? null,
      imageAlt: c.imageAlt ?? null,

      published: true,
      sortOrder: i,
    };

    if (exists) {
      await prisma.course.update({ where: { slug }, data });
      updated++;
    } else {
      await prisma.course.create({ data: { slug, ...data } });
      created++;
    }
  }

  return { read: courses.length, created, updated };
}
