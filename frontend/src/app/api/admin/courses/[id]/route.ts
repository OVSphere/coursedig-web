// frontend/src/app/api/admin/courses/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string }>;
};

function json(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

function isUniqueConstraintError(e: any) {
  return (
    e?.code === "P2002" ||
    (typeof e?.message === "string" && e.message.includes("Unique constraint"))
  );
}

async function getId(ctx: Ctx) {
  const { id } = await ctx.params;
  return String(id || "").trim();
}

function toTrimmedString(v: any) {
  return String(v ?? "").trim();
}

function toNullableTrimmedString(v: any) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function buildUpdateData(body: any) {
  const data: Record<string, any> = {};

  // -------------------------
  // Core fields
  // -------------------------
  if ("title" in body) data.title = toTrimmedString(body.title);
  if ("slug" in body) data.slug = toTrimmedString(body.slug);

  // category is optional in schema, but your Admin UI expects it.
  // Treat empty string as null, but also prevent "clearing" it accidentally.
  if ("category" in body) data.category = toNullableTrimmedString(body.category);

  if ("shortDescription" in body) {
    data.shortDescription = toNullableTrimmedString(body.shortDescription);
  }

  if ("overview" in body) data.overview = toTrimmedString(body.overview);

  // -------------------------
  // Optional content fields
  // (empty string -> null)
  // -------------------------
  if ("whoItsFor" in body) data.whoItsFor = toNullableTrimmedString(body.whoItsFor);
  if ("whatYoullLearn" in body) data.whatYoullLearn = toNullableTrimmedString(body.whatYoullLearn);
  if ("entryRequirements" in body) data.entryRequirements = toNullableTrimmedString(body.entryRequirements);
  if ("duration" in body) data.duration = toNullableTrimmedString(body.duration);
  if ("delivery" in body) data.delivery = toNullableTrimmedString(body.delivery);
  if ("startDatesNote" in body) data.startDatesNote = toNullableTrimmedString(body.startDatesNote);
  if ("priceNote" in body) data.priceNote = toNullableTrimmedString(body.priceNote);

  if ("heroImage" in body) data.heroImage = toNullableTrimmedString(body.heroImage);
  if ("imageAlt" in body) data.imageAlt = toNullableTrimmedString(body.imageAlt);

  if ("sortOrder" in body) data.sortOrder = toInt(body.sortOrder, 0);
  if ("published" in body) data.published = Boolean(body.published);

  // -------------------------
  // Validation (only when provided)
  // -------------------------
  if ("title" in data && !data.title) {
    return { ok: false as const, message: "Title is required." };
  }
  if ("slug" in data && !data.slug) {
    return { ok: false as const, message: "Slug is required." };
  }
  if ("overview" in data && !data.overview) {
    return { ok: false as const, message: "Overview is required." };
  }

  // IMPORTANT: prevent accidental clearing of category (UI expects it)
  if ("category" in data && !data.category) {
    return { ok: false as const, message: "Category is required." };
  }

  return { ok: true as const, data };
}

export async function GET(_req: Request, ctx: Ctx) {
  const gate = await requireAdminApi();
  if (!gate.ok) return json("Forbidden", gate.status);

  const courseId = await getId(ctx);
  if (!courseId) return json("Missing course id.", 400);

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { fee: true },
  });

  if (!course) return json("Course not found.", 404);

  return NextResponse.json({ course }, { status: 200 });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const gate = await requireAdminApi();
  if (!gate.ok) return json("Forbidden", gate.status);

  const courseId = await getId(ctx);
  if (!courseId) return json("Missing course id.", 400);

  const body = await req.json().catch(() => ({}));
  const built = buildUpdateData(body);
  if (!built.ok) return json(built.message, 400);

  try {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: built.data,
      include: { fee: true },
    });

    return NextResponse.json({ course }, { status: 200 });
  } catch (e: any) {
    const msg = isUniqueConstraintError(e)
      ? "Slug already exists. Please choose another."
      : "Failed to update course.";
    return json(msg, 400);
  }
}

// ✅ IMPORTANT: AdminCourseEditClient uses PATCH already,
// but keep PUT as alias to prevent old clients breaking.
export async function PUT(req: Request, ctx: Ctx) {
  return PATCH(req, ctx);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const gate = await requireAdminApi();
  if (!gate.ok) return json("Forbidden", gate.status);

  const courseId = await getId(ctx);
  if (!courseId) return json("Missing course id.", 400);

  try {
    await prisma.course.delete({ where: { id: courseId } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return json("Failed to delete course.", 400);
  }
}
