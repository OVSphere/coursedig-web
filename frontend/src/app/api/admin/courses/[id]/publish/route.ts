// frontend/src/app/api/admin/courses/[id]/publish/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export async function POST(
  _: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const { id } = await ctx.params;

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const course = await prisma.course.update({
    where: { id },
    data: { published: !existing.published },
    include: { fee: true },
  });

  return NextResponse.json({ course }, { status: 200 });
}
