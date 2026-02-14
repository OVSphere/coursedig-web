import { NextResponse } from "next/server";
import { getPrismaServer } from "@/lib/prisma-server";

// Ensure this runs on Node.js (pg/Prisma adapter needs Node, not Edge)
export const runtime = "nodejs";

// Avoid any static optimisation/build-time execution
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const { prisma } = getPrismaServer();

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
