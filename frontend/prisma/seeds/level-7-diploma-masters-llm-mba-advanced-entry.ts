// prisma/seeds/level-7-diploma-masters-llm-mba-advanced-entry.ts
import type { PrismaClient } from "../../src/generated/prisma/client";
import { readJsonArray } from "./_helpers";

type CourseJson = {
  slug: string;
  title: string;
  shortDescription?: string;
  overview?: string;
  delivery?: string;
  duration?: string;
  entryRequirements?: string;
  startDatesNote?: string;
  priceNote?: string;
  heroImage?: string | null;
  imageAlt?: string | null;
};

const CATEGORY = "Level 7 Diploma – Masters / LLM / MBA Advanced Entry";

export default async function seedLevel7(prisma: PrismaClient) {
  const rows = readJsonArray<CourseJson>(
    "data/level-7-diploma-masters-llm-mba-advanced-entry.json"
  );

  let created = 0;
  let updated = 0;

  for (let i = 0; i < rows.length; i++) {
    const c = rows[i];
    if (!c?.slug || !c?.title) continue;

    const existing = await prisma.course.findUnique({
      where: { slug: c.slug },
      select: { id: true },
    });

    const data = {
      title: c.title,
      category: CATEGORY,
      shortDescription: c.shortDescription || "View details and next steps.",
      overview: c.overview || `Full details for ${c.title} will be published shortly.`,
      delivery: c.delivery || null,
      duration: c.duration || null,
      entryRequirements: c.entryRequirements || null,
      startDatesNote: c.startDatesNote || null,
      priceNote: c.priceNote || null,
      heroImage: c.heroImage ?? null,
      imageAlt: c.imageAlt ?? null,
      published: true,
      sortOrder: i,
    };

    if (existing) {
      await prisma.course.update({ where: { slug: c.slug }, data });
      updated++;
    } else {
      await prisma.course.create({ data: { slug: c.slug, ...data } });
      created++;
    }
  }

  return { created, updated, read: rows.length };
}
