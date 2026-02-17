//frontend\src\app\api\admin\newsletter\subscribers\route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function forbidden() {
  return NextResponse.json({ message: "Forbidden" }, { status: 403 });
}

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  // Admin or Super Admin can view list
  if (!user.isAdmin && !user.isSuperAdmin) return forbidden();

  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") ?? "").trim().toLowerCase();
  const take = Math.min(200, Math.max(1, Number(searchParams.get("take") ?? 100)));

  const items = await prisma.newsletterSubscriber.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      email: true,
      fullName: true,
      source: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(
    {
      items: items.map((x) => ({
        ...x,
        createdAt: x.createdAt.toISOString(),
        updatedAt: x.updatedAt.toISOString(),
      })),
    },
    { status: 200 }
  );
}

/**
 * Super Admin: bulk delete
 * Body:
 * { ids: string[] } OR { all: true } OR { inactiveOnly: true }
 */
export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  if (!user.isSuperAdmin) return forbidden();

  const body = await req.json().catch(() => ({}));

  const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
  const all = !!body.all;
  const inactiveOnly = !!body.inactiveOnly;

  if (!all && !inactiveOnly && ids.length === 0) {
    return NextResponse.json(
      { message: "Provide ids[] or all=true or inactiveOnly=true" },
      { status: 400 }
    );
  }

  const where = all ? {} : inactiveOnly ? { isActive: false } : { id: { in: ids } };

  const result = await prisma.newsletterSubscriber.deleteMany({ where });
  return NextResponse.json({ deleted: result.count }, { status: 200 });
}

/**
 * Super Admin: create subscriber manually
 * Body:
 * { email: string, fullName?: string, source?: string, isActive?: boolean }
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  if (!user.isSuperAdmin) return forbidden();

  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? "").trim().toLowerCase();
  const fullName = body.fullName ? String(body.fullName).trim() : null;
  const source = body.source ? String(body.source).trim() : "admin";
  const isActive = body.isActive === false ? false : true;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Enter a valid email." }, { status: 400 });
  }

  try {
    const created = await prisma.newsletterSubscriber.create({
      data: { email, fullName, source, isActive },
      select: { id: true },
    });
    return NextResponse.json({ id: created.id }, { status: 200 });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ message: "Email already exists." }, { status: 409 });
    }
    console.error("NEWSLETTER_SUBSCRIBERS_CREATE_ERROR:", e);
    return NextResponse.json({ message: "Create failed. Please try again." }, { status: 500 });
  }
}
