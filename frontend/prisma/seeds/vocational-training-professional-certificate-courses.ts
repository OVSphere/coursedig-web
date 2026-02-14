// prisma/seeds/vocational-training-professional-certificate-courses.ts
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { readJsonArray } from "./_helpers";

type CourseRow = {
  slug?: string; // optional (slug can be generated)
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

function pick<T extends Record<string, any>>(obj: T, keys: (keyof T)[]) {
  const out: Partial<T> = {};
  for (const k of keys) {
    if (k in obj) (out as any)[k] = obj[k];
  }
  return out as Partial<T>;
}

/**
 * Prisma sometimes masks the exact missing column in adapter errors.
 * This function retries with smaller payloads when we hit P2022 ColumnNotFound.
 */
async function upsertWithFallback(
  prisma: PrismaClient,
  slug: string,
  dataFull: Record<string, any>
) {
  const exists = await prisma.course.findUnique({
    where: { slug },
    select: { id: true },
  });

  // Fallback tiers (largest -> smallest)
  // Tier 0: full payload (what we WANT)
  // Tier 1: remove commonly-missing admin fields
  // Tier 2: remove images + notes (often added/renamed later)
  // Tier 3: minimal core fields (should exist in any schema)
  const tier0 = dataFull;

  const tier1 = (() => {
    const { published, sortOrder, ...rest } = dataFull;
    return rest;
  })();

  const tier2 = (() => {
    const { heroImage, imageAlt, startDatesNote, priceNote, ...rest } = tier1 as any;
    return rest;
  })();

  const tier3 = pick(tier2 as any, [
    "title",
    "category",
    "shortDescription",
    "overview",
  ] as any);

  const tiers = [
    { name: "tier0(full)", data: tier0 },
    { name: "tier1(no published/sortOrder)", data: tier1 },
    { name: "tier2(no images/notes)", data: tier2 },
    { name: "tier3(minimal)", data: tier3 },
  ] as const;

  // Try each tier until it works
  for (const t of tiers) {
    try {
      if (exists) {
        await prisma.course.update({ where: { slug }, data: t.data });
        return { action: "updated" as const, tier: t.name };
      } else {
        await prisma.course.create({ data: { slug, ...t.data } });
        return { action: "created" as const, tier: t.name };
      }
    } catch (e) {
      // Only retry on missing column errors
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2022"
      ) {
        console.warn(
          `⚠️ Seed fallback needed for slug="${slug}" (${t.name}) -> ${e.code}: ${e.message}`
        );
        // Try next tier
        continue;
      }
      // Other errors should bubble up
      throw e;
    }
  }

  // If even minimal tier fails, throw a clear error
  throw new Error(
    `Seed failed for slug="${slug}" even with minimal fields. Check schema/migrations.`
  );
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
      category,

      shortDescription:
        clean(c.shortDescription) ?? "View details and next steps.",
      overview:
        clean(c.overview) ?? `Full details for ${title} will be published shortly.`,

      whoItsFor: clean(c.whoItsFor),
      whatYoullLearn: clean(c.whatYoullLearn),

      delivery: clean(c.delivery),
      duration: clean(c.duration),
      entryRequirements: clean(c.entryRequirements),
      startDatesNote: clean(c.startDatesNote),
      priceNote: clean(c.priceNote),

      heroImage: clean(c.heroImage),
      imageAlt: clean(c.imageAlt),

      // These commonly cause mismatches when schema evolves
      published: true,
      sortOrder: i,
    };

    const result = await upsertWithFallback(prisma, slug, data);

    // Count stats
    if (result.action === "created") created++;
    else updated++;

    // Optional: helpful trace (safe)
    if (result.tier !== "tier0(full)") {
      console.log(`ℹ️ slug="${slug}" used ${result.tier}`);
    }
  }

  return { read: courses.length, created, updated };
}
