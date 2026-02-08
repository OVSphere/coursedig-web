// src/app/api/admin/users/[id]/role/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSecureAdminApi } from "@/lib/admin";
import { verifyAdminSecondFactor } from "@/lib/auth";

export const dynamic = "force-dynamic";

function json(message: string, status: number, extra?: Record<string, any>) {
  return NextResponse.json({ message, ...(extra || {}) }, { status });
}

type Body = {
  role?: "USER" | "ADMIN" | "SUPER_ADMIN";
  justification?: string;
  secondFactor?: string;
};

/**
 * Next.js App Router note:
 * In some versions, ctx.params is a Promise and must be awaited.
 * This helper supports BOTH shapes safely.
 */
async function getParamId(ctx: any): Promise<string | null> {
  const p = ctx?.params;
  if (!p) return null;

  // If params is a Promise (Next.js dynamic API behaviour)
  if (typeof p?.then === "function") {
    const awaited = await p;
    return awaited?.id ?? null;
  }

  // If params is a normal object
  return p?.id ?? null;
}

export async function POST(req: Request, ctx: any) {
  // 🔐 Super Admin role gate ONLY (password verified below)
  const gate = await requireSecureAdminApi();

  if (!gate.ok) {
    return json(
      gate.reason === "UNAUTHENTICATED" ? "Unauthorised" : "Forbidden",
      gate.status
    );
  }

  const actor = gate.user;

  // ✅ FIX: unwrap params safely (works whether Promise or object)
  const targetUserId = await getParamId(ctx);
  if (!targetUserId) {
    return json("Missing user id.", 400);
  }

  const body = (await req.json().catch(() => ({}))) as Body;

  const role = body.role;
  const justification = String(body.justification ?? "").trim();
  const secondFactor = String(body.secondFactor ?? "").trim();

  if (!role || !["USER", "ADMIN", "SUPER_ADMIN"].includes(role)) {
    return json("Invalid role selection.", 400);
  }

  if (justification.length < 20) {
    return json("Justification must be at least 20 characters.", 400);
  }

  if (!secondFactor || secondFactor.length < 6) {
    return json("Super Admin password is required.", 400, {
      code: "SECOND_FACTOR_REQUIRED",
    });
  }

  // 🔐 Verify actor password
  const actorRow = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { adminSecondFactorHash: true, isSuperAdmin: true },
  });

  if (!actorRow?.isSuperAdmin) {
    return json("Forbidden", 403);
  }

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
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, isAdmin: true, isSuperAdmin: true },
  });

  if (!target) return json("User not found.", 404);

  // 🚫 prevent self-lockout
  if (target.id === actor.id) {
    return json("You cannot change your own role.", 400);
  }

  // Determine update + audit action
  let updateData: { isAdmin: boolean; isSuperAdmin: boolean };
  let auditAction:
    | "USER_PROMOTE_ADMIN"
    | "USER_DEMOTE_ADMIN"
    | "USER_PROMOTE_SUPERADMIN"
    | "USER_DEMOTE_SUPERADMIN";

  if (role === "USER") {
    if (!target.isAdmin && !target.isSuperAdmin) {
      return json("User already has this role.", 200, { already: true });
    }
    updateData = { isAdmin: false, isSuperAdmin: false };
    auditAction = target.isSuperAdmin
      ? "USER_DEMOTE_SUPERADMIN"
      : "USER_DEMOTE_ADMIN";
  } else if (role === "ADMIN") {
    if (target.isAdmin && !target.isSuperAdmin) {
      return json("User already has this role.", 200, { already: true });
    }
    updateData = { isAdmin: true, isSuperAdmin: false };
    auditAction = target.isSuperAdmin
      ? "USER_DEMOTE_SUPERADMIN"
      : "USER_PROMOTE_ADMIN";
  } else {
    // SUPER_ADMIN
    if (target.isSuperAdmin) {
      return json("User already has this role.", 200, { already: true });
    }
    updateData = { isAdmin: true, isSuperAdmin: true };
    auditAction = "USER_PROMOTE_SUPERADMIN";
  }

  const ipAddress =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for") ||
    null;

  const userAgent = req.headers.get("user-agent") || null;

  const updated = await prisma.$transaction(async (tx) => {
    const before = {
      isAdmin: target.isAdmin,
      isSuperAdmin: target.isSuperAdmin,
    };

    const user = await tx.user.update({
      where: { id: target.id },
      data: updateData,
      select: { id: true, isAdmin: true, isSuperAdmin: true },
    });

    await tx.authzAuditEvent.create({
      data: {
        action: auditAction,
        actorUserId: actor.id,
        targetUserId: target.id,
        ipAddress: ipAddress?.toString() || null,
        userAgent,
        before,
        after: user,
        meta: { justification, newRole: role },
      },
    });

    return user;
  });

  return json("User role updated successfully.", 200, { user: updated });
}
