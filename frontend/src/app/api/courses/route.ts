//"C:\Users\murio\coursedig-web\frontend\src\app\api\courses\route.ts"
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

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
      orderBy: [
        { category: "asc" },
        { sortOrder: "asc" },
        { title: "asc" },
      ],
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
