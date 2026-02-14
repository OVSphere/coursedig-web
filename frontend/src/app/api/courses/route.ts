// frontend/src/app/api/courses/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Updated to match the lib/prisma.ts singleton

// 💡 FORCE dynamic rendering so it reads the DATABASE_URL at RUNTIME, not build time.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    // Using the prisma singleton directly
    const courses = await prisma.course.findMany({
      where: {
        published: true,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { shortDescription: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        category: true,
        shortDescription: true,
        sortOrder: true,
      },
    });

    return NextResponse.json({ courses }, { status: 200 });
  } catch (error: any) {
    console.error("COURSES_API_ERROR:", error);

    return NextResponse.json(
      {
        message: "Failed to load courses.",
        error: error?.message ?? String(error),
        code: error?.code ?? null,
      },
      { status: 500 }
    );
  }
}