// frontend/src/app/api/courses/[slug]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const slug = String(params.slug || "").trim();

  const course = await prisma.course.findFirst({
    where: { slug, published: true },
  });

  if (!course) {
    return NextResponse.json({ message: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({ course }, { status: 200 });
}
