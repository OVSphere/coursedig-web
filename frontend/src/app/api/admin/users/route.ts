// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  // 🔐 Admin guard (admin OR super admin)
  const gate = await requireAdminApi();

  if (!gate.ok) {
    return NextResponse.json(
      { message: gate.reason === "UNAUTHENTICATED" ? "Unauthorised" : "Forbidden" },
      { status: gate.status }
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      emailVerifiedAt: true,
      isAdmin: true,
      isSuperAdmin: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ users }, { status: 200 });
}
