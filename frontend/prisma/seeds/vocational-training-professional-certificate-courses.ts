// prisma/seeds/vocational-training-professional-certificate-courses.ts
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
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

function pick(obj: Record<string, any>, keys: string[]) {
  const out: Record<string, any> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
}

async function logCourseColumns(prisma: PrismaClient) {
  try {
    const rows = (await prisma.$queryRaw`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name IN ('Course','course','courses')
      ORDER BY table_name, ordinal_position
    `) as Array<{ table_name: string; column_name: string }>;

    if (!rows?.length) {
      console.warn("ℹ️ Could not find Course columns in information_schema.");
      return;
    }

    const grouped: Record<string, string[]> = {};
    for (const r of rows) {
      grouped[r.table_name] ??= [];
      grouped[r.table_name].push(r.column_name);
    }

    console.warn("🔎 Detected DB columns for Course tables:", grouped);
  } catch (e) {
    console.warn("ℹ️ Failed to read information_schema columns:", e);
  }
}

async function upsertWithFallback(
  prisma: PrismaClient,
  slug: string,
  dataFull: Record<string, any>
) {
  const exists = await prisma.course.findUnique({
    where: { slug },
    select: { id: true },
  });

  // progressively smaller payloads
  const tier0 = dataFull;
  const tier1 = (() => {
    const { published, sortOrder, ...rest } = dataFull;
    return rest;
  })();
  const tier2 = (() => {
    const { heroImage, imageAlt, startDatesNote, priceNote, ...rest } = tier1 as any;
    return rest;
  })();
  const tier3 = pick(tier2 as any, ["title", "category", "shortDescription", "overview"]);
  const tier4 = pick(tier2 as any, ["title", "category"]);
  const tier5 = pick(tier2 as any, ["title"]);

  const tiers = [
    { name: "tier0(full)", data: tier0 },
    { name: "tier1(no published/sortOrder)", data: tier1 },
    { name: "tier2(no images/notes)", data: tier2 },
    { name: "tier3(title/category/shortDescription/overview)", data: tier3 },
    { name: "tier4(title/category)", data: tier4 },
    { name: "tier5(title only)", data: tier5 },
  ] as const;

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
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
        console.warn(`⚠️ Seed fallback needed for slug="${slug}" (${t.name}) -> P2022`);
        continue;
      }
      throw e;
    }
  }

  // Don't fail the whole seed/build — log schema info then skip
  console.warn(`❌ Skipping slug="${slug}" — schema mismatch even for title-only payload.`);
  await logCourseColumns(prisma);
  return { action: "skipped" as const, tier: "none" as const };
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
      shortDescription: clean(c.shortDescription) ?? "View details and next steps.",
      overview: clean(c.overview) ?? `Full details for ${title} will be published shortly.`,
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

    const res = await upsertWithFallback(prisma, slug, data);

    if (res.action === "created") created++;
    else if (res.action === "updated") updated++;

    if (res.tier !== "tier0(full)" && res.tier !== "none") {
      console.log(`ℹ️ slug="${slug}" used ${res.tier}`);
    }
  }

  return { read: courses.length, created, updated };
}
