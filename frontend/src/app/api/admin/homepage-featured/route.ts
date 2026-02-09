// frontend/src/app/api/admin/homepage-featured/route.ts
// ✅ NEW (CourseDig): Manage homepage featured ranks (Admin + Super Admin) + Audit Trail

import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { getPrismaServer } from "@/lib/prisma-server";

// Best-effort: capture IP/user-agent (works behind proxies if x-forwarded-for is set)
function getIp(req: Request) {
  const xf = req.headers.get("x-forwarded-for") || "";
  const ip = xf.split(",")[0]?.trim();
  return ip || req.headers.get("x-real-ip") || null;
}

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
  rank: number | null;
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
    return NextResponse.json(
      { message: "Rank must be a number between 1 and 50 (or null)." },
      { status: 400 }
    );
  }

  // ✅ Read current values so we can audit BEFORE/AFTER
  const before = await prisma.course.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      homePopularRank: true,
      homeLevel45Rank: true,
      homeLevel7Rank: true,
    },
  });

  if (!before) {
    return NextResponse.json({ message: "Course not found." }, { status: 404 });
  }

  const data =
    section === "POPULAR"
      ? { homePopularRank: rank }
      : section === "LEVEL45"
      ? { homeLevel45Rank: rank }
      : { homeLevel7Rank: rank };

  const updated = await prisma.course.update({
    where: { id },
    data,
    select: {
      id: true,
      title: true,
      slug: true,
      homePopularRank: true,
      homeLevel45Rank: true,
      homeLevel7Rank: true,
    },
  });

  // ✅ AUDIT TRAIL
  // Uses existing enum value COURSE_UPDATE (no extra migration needed).
  // Stores full before/after and meta about the specific change.
  try {
    await prisma.authzAuditEvent.create({
      data: {
        action: "COURSE_UPDATE",
        actorUserId: gate.user!.id,
        targetCourseId: updated.id,
        ipAddress: getIp(req),
        userAgent: req.headers.get("user-agent"),
        before: {
          courseId: before.id,
          title: before.title,
          slug: before.slug,
          homePopularRank: before.homePopularRank,
          homeLevel45Rank: before.homeLevel45Rank,
          homeLevel7Rank: before.homeLevel7Rank,
        },
        after: {
          courseId: updated.id,
          title: updated.title,
          slug: updated.slug,
          homePopularRank: updated.homePopularRank,
          homeLevel45Rank: updated.homeLevel45Rank,
          homeLevel7Rank: updated.homeLevel7Rank,
        },
        meta: {
          featureArea: "HOMEPAGE_FEATURED",
          section,
          rank,
        },
      },
    });
  } catch (e) {
    // Never block the main action if audit fails
    console.warn("AUDIT_LOG_FAILED:", e);
  }

  return NextResponse.json({ ok: true });
}
