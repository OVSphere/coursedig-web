// prisma/seeds/vocational-training-professional-certificate-courses.tsimport type { PrismaClient } from "../../src/generated/prisma/client";
import { readJsonArray } from "./_helpers";

type CourseRow = {
  slug: string;
  title: string;
  shortDescription?: string;
  overview?: string;
  delivery?: string;
  duration?: string;
  entryRequirements?: string;
  startDatesNote?: string;
  priceNote?: string;
  heroImage?: string;
  imageAlt?: string;
};

export type SeedResult = { read: number; created: number; updated: number };

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
    if (!c?.slug) continue;

    const exists = await prisma.course.findUnique({
      where: { slug: c.slug },
      select: { id: true },
    });

    const data = {
      title: c.title,
      category,
      shortDescription: c.shortDescription ?? "View details and next steps.",
      overview: c.overview ?? `Full details for ${c.title} will be published shortly.`,
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
      await prisma.course.update({ where: { slug: c.slug }, data });
      updated++;
    } else {
      await prisma.course.create({ data: { slug: c.slug, ...data } });
      created++;
    }
  }

  return { read: courses.length, created, updated };
}
