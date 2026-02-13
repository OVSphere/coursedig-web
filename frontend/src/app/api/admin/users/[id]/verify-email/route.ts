// src/app/api/admin/users/[id]/verify-email/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSecureAdminApi } from "@/lib/admin";
import { verifyAdminSecondFactor } from "@/lib/auth";

export const dynamic = "force-dynamic";

function json(message: string, status: number, extra?: Record<string, any>) {
  return NextResponse.json({ message, ...(extra || {}) }, { status });
}

type Body = {
  justification?: string;
  secondFactor?: string;
};

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // ✅ Next dynamic params are async (in your build)
) {
  // 🔐 Super Admin role gate ONLY (password verified below)
  const gate = await requireSecureAdminApi();

  if (!gate.ok) {
    // ✅ Fix: only compare against reasons that actually exist in the gate type
    return json(
      gate.reason === "UNAUTHENTICATED" ? "Unauthorised" : "Forbidden",
      gate.status
    );
  }

  const actor = gate.user;

  // ✅ unwrap params safely
  const { id: targetUserId } = await ctx.params;

  if (!targetUserId) {
    return json("User not found.", 404);
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const justification = String(body.justification ?? "").trim();
  const secondFactor = String(body.secondFactor ?? "").trim();

  // 📝 Mandatory justification (audit requirement)
  if (justification.length < 20) {
    return json("Justification must be at least 20 characters.", 400);
  }

  // 🔐 Require super admin password (second factor)
  if (!secondFactor || secondFactor.length < 6) {
    return json("Super Admin password is required.", 400, {
      code: "SECOND_FACTOR_REQUIRED",
    });
  }

  // 🔐 Verify actor password (and ensure actor is Super Admin)
  const actorRow = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { adminSecondFactorHash: true, isSuperAdmin: true },
  });

  if (!actorRow?.isSuperAdmin) return json("Forbidden.", 403);

  if (!actorRow.adminSecondFactorHash) {
    return json("Super Admin password is not set for this account.", 403, {
      code: "SECOND_FACTOR_NOT_SET",
    });
  }

  const ok = await verifyAdminSecondFactor(
    secondFactor,
    actorRow.adminSecondFactorHash
  );

  if (!ok) {
    return json("Super Admin password is incorrect.", 403, {
      code: "SECOND_FACTOR_INVALID",
    });
  }

  // 🔍 Fetch target user
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, email: true, emailVerifiedAt: true },
  });

  if (!targetUser) {
    return json("User not found.", 404);
  }

  // ✅ Idempotent: already verified
  if (targetUser.emailVerifiedAt) {
    return json("User email is already verified.", 200, {
      alreadyVerified: true,
    });
  }

  // 🌐 Context info for audit
  const ipAddress =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for") ||
    null;

  const userAgent = req.headers.get("user-agent") || null;

  // 🔁 Verify + invalidate tokens + audit atomically
  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUser.id },
      data: { emailVerifiedAt: new Date() },
    }),

    prisma.emailVerificationToken.deleteMany({
      where: { userId: targetUser.id },
    }),

    prisma.authzAuditEvent.create({
      data: {
        action: "USER_EMAIL_VERIFIED_BY_ADMIN",
        actorUserId: actor.id,
        targetUserId: targetUser.id,
        ipAddress: ipAddress?.toString() || null,
        userAgent,
        meta: {
          justification,
          method: "manual-admin-override",
          actorRole: "SUPER_ADMIN",
        },
      },
    }),
  ]);

  return json("User email verified successfully.", 200, { verified: true });
}
