// frontend/src/app/api/courses/[slug]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ slug: string }>;
};

function json(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export async function GET(_req: Request, ctx: Ctx) {
  const { slug } = await ctx.params;
  const s = String(slug || "").trim();

  if (!s) return json("Course not found", 404);

  const course = await prisma.course.findFirst({
    where: { slug: s, published: true },
  });

  if (!course) return json("Course not found", 404);

  return NextResponse.json({ course }, { status: 200 });
}
