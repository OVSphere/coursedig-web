// frontend/src/app/api/admin/homepage-featured/route.ts
// ✅ NEW (CourseDig): Manage homepage featured ranks (Admin + Super Admin)

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { getPrismaServer } from "@/lib/prisma-server";

export async function GET(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();

  const { prisma } = getPrismaServer();

  const items = await prisma.course.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      homePopularRank: true,
      homeLevel45Rank: true,
      homeLevel7Rank: true,
    },
  });

  return NextResponse.json({ items });
}

type Body = {
  id: string;
  section: "POPULAR" | "LEVEL45" | "LEVEL7";
  rank: number | null; // null => remove from featured
};

export async function POST(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) {
    return NextResponse.json({ message: "Forbidden" }, { status: gate.status });
  }

  const { prisma } = getPrismaServer();

  const body = (await req.json().catch(() => ({}))) as Partial<Body>;
  const id = String(body.id || "").trim();
  const section = body.section;
  const rankRaw = body.rank;

  if (!id) return NextResponse.json({ message: "Missing course id." }, { status: 400 });
  if (!section) return NextResponse.json({ message: "Missing section." }, { status: 400 });

  const rank =
    rankRaw === null || rankRaw === undefined || rankRaw === ("" as any)
      ? null
      : Number(rankRaw);

  if (rank !== null && (!Number.isFinite(rank) || rank < 1 || rank > 50)) {
    return NextResponse.json({ message: "Rank must be a number between 1 and 50 (or null)." }, { status: 400 });
  }

  const data =
    section === "POPULAR"
      ? { homePopularRank: rank }
      : section === "LEVEL45"
      ? { homeLevel45Rank: rank }
      : { homeLevel7Rank: rank };

  await prisma.course.update({
    where: { id },
    data,
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
