//src/app/api/admin/superadmin/second-factor/set/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/admin";
import { hashAdminSecondFactor } from "@/lib/auth";

export const dynamic = "force-dynamic";

function json(message: string, status: number, extra?: Record<string, any>) {
  return NextResponse.json({ message, ...(extra || {}) }, { status });
}

type Body = {
  password?: string;
};

export async function POST(req: Request) {
  // 🔐 Super Admin only
  const gate = await requireSuperAdminApi();

  if (!gate.ok) {
    return json(
      gate.reason === "UNAUTHENTICATED" ? "Unauthorised" : "Forbidden",
      gate.status
    );
  }

  const actor = gate.user;

  const body = (await req.json().catch(() => ({}))) as Body;
  const password = String(body.password ?? "");

  if (password.length < 8) {
    return json(
      "Super Admin password must be at least 8 characters.",
      400
    );
  }

  // 🔍 Check if already set (do not allow overwrite silently)
  const existing = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { adminSecondFactorHash: true },
  });

  if (existing?.adminSecondFactorHash) {
    return json(
      "Super Admin password is already set.",
      400,
      { code: "SECOND_FACTOR_ALREADY_SET" }
    );
  }

  const hash = await hashAdminSecondFactor(password);

  const ipAddress =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for") ||
    null;

  const userAgent = req.headers.get("user-agent") || null;

  // ✅ Atomic update + audit
  await prisma.$transaction([
    prisma.user.update({
      where: { id: actor.id },
      data: { adminSecondFactorHash: hash },
    }),

    prisma.authzAuditEvent.create({
      data: {
        action: "SUPERADMIN_SECOND_FACTOR_SET",
        actorUserId: actor.id,
        ipAddress: ipAddress?.toString() || null,
        userAgent,
      },
    }),
  ]);

  return json("Super Admin password set successfully.", 200);
}
