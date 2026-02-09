// frontend/src/app/api/admin/applications/route.ts
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function jsonOk(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function jsonErr(message: string, status = 400, extra?: any) {
  return NextResponse.json({ message, ...(extra || {}) }, { status });
}

export async function GET(req: Request) {
  const gate = await requireAdminApi();
  if (!gate.ok) {
    return jsonErr(
      "Not authorised.",
      gate.status,
      gate.reason ? { reason: gate.reason } : undefined
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limitRaw = Number(url.searchParams.get("limit") || "50");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), 200)
    : 50;

  const where = q
    ? {
        OR: [
          { appRef: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { courseName: { contains: q, mode: "insensitive" as const } },
          { firstName: { contains: q, mode: "insensitive" as const } },
          { lastName: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const rows = await prisma.application.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      applicationType: true,
      appRef: true,
      firstName: true,
      lastName: true,
      email: true,
      countryOfResidence: true,
      courseName: true,
      createdAt: true,
      status: true,
      _count: { select: { attachments: true } },
    },
  });

  const items = rows.map((r) => ({
    id: r.id,
    applicationType: r.applicationType,
    appRef: r.appRef,
    firstName: r.firstName,
    lastName: r.lastName,
    email: r.email,
    countryOfResidence: r.countryOfResidence,
    courseName: r.courseName,
    createdAt: r.createdAt,
    status: r.status,
    attachmentsCount: r._count?.attachments ?? 0,
  }));

  return jsonOk({ items, count: items.length });
}
