// frontend/src/app/api/admin/courses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

function toNullableString(v: any) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

export async function GET(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  const courses = await prisma.course.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
    include: { fee: true },
    take: 500,
  });

  return NextResponse.json({ courses }, { status: 200 });
}

export async function POST(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const body = await req.json().catch(() => ({}));

  const title = String(body?.title ?? "").trim();
  const slug = String(body?.slug ?? "").trim();
  const overview = String(body?.overview ?? "").trim();

  const category = toNullableString(body?.category);
  const shortDescription = toNullableString(body?.shortDescription);

  if (!title) {
    return NextResponse.json({ message: "Title is required." }, { status: 400 });
  }
  if (!slug) {
    return NextResponse.json({ message: "Slug is required." }, { status: 400 });
  }
  if (!overview) {
    return NextResponse.json(
      { message: "Overview is required." },
      { status: 400 }
    );
  }

  try {
    const course = await prisma.course.create({
      data: {
        title,
        slug,
        category,
        shortDescription,
        overview,
        published: false,
        sortOrder: 0,
      },
      include: { fee: true },
    });

    return NextResponse.json({ course }, { status: 201 });
  } catch (e: any) {
    const msg =
      typeof e?.message === "string" &&
      (e.message.includes("Unique constraint") ||
        e.message.includes("Unique constraint failed") ||
        e.message.includes("P2002"))
        ? "Slug already exists. Please choose another."
        : "Failed to create course.";

    return NextResponse.json({ message: msg }, { status: 400 });
  }
}
