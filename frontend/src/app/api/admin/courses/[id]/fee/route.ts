// frontend/src/app/api/admin/courses/[id]/fee/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

const LEVELS = ["VOCATIONAL", "LEVEL3", "LEVEL4_5", "LEVEL7"] as const;
type CourseLevel = (typeof LEVELS)[number];

function isCourseLevel(v: string): v is CourseLevel {
  return (LEVELS as readonly string[]).includes(v);
}

function json(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const gate = await requireAdminApi();
  if (!gate.ok) return json("Forbidden", gate.status);

  const { id } = await ctx.params;
  if (!id) return json("Missing course id.", 400);

  const body = await req.json().catch(() => ({}));

  const levelRaw = String(body?.level || "").trim();
  const amountPence = Number(body?.amountPence ?? 0);
  const currency = String(body?.currency || "GBP").trim().toUpperCase();
  const note = body?.note ?? null;
  const isActive = Boolean(body?.isActive ?? true);

  // ✅ Validate level against Prisma enum
  if (!levelRaw) return json("Level is required.", 400);
  if (!isCourseLevel(levelRaw)) {
    return json("Invalid level. Use VOCATIONAL, LEVEL3, LEVEL4_5, or LEVEL7.", 400);
  }

  // ✅ Decide fee validation rules:
  // - allow amountPence = 0 ONLY if fee is inactive (lets you draft a fee)
  if (!Number.isFinite(amountPence) || amountPence < 0) {
    return json("Amount must be a valid number (pence).", 400);
  }
  if (isActive && amountPence <= 0) {
    return json("Amount must be a positive number (pence) when fee is active.", 400);
  }

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) return json("Course not found.", 404);

  await prisma.courseFee.upsert({
    where: { courseId: id },
    create: {
      courseId: id,
      level: levelRaw,
      amountPence,
      currency,
      note,
      isActive,
      // keep defaults from schema for payInFull fields
    },
    update: {
      level: levelRaw,
      amountPence,
      currency,
      note,
      isActive,
    },
  });

  const updated = await prisma.course.findUnique({
    where: { id },
    include: { fee: true },
  });

  return NextResponse.json({ course: updated }, { status: 200 });
}
