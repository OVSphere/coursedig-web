// frontend/src/lib/admin.ts
import { getCurrentUser } from "@/lib/auth";

/**
 * NOTE (CourseDig update - gate helpers + role flags):
 * 2026-02-08
 * ✅ Adds small helper utilities to avoid repeating role logic everywhere
 * ✅ Normalises API helper responses (no more (gate as any).user)
 * ✅ Keeps existing functions and return shapes compatible
 */

/* =========================================================
   ✅ NEW (CourseDig): shared types + role helpers
   ========================================================= */

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

// ✅ NEW: simple role predicates (single source of truth)
export function isAdminOrSuperAdmin(user: CurrentUser) {
  return !!user.isAdmin || !!user.isSuperAdmin;
}

// ✅ NEW: safe role flags for UI / API use
export function roleFlags(user: CurrentUser) {
  return {
    isAdmin: !!user.isAdmin,
    isSuperAdmin: !!user.isSuperAdmin,
    isAdminOrSuperAdmin: isAdminOrSuperAdmin(user),
  };
}

/* =========================================================
   ✅ ADMIN (Admin OR Super Admin)
   ========================================================= */

export type RequireAdminReason = "UNAUTHENTICATED" | "FORBIDDEN";

export type RequireAdminResult =
  | {
      ok: true;
      user: CurrentUser;

      // ✅ NEW (CourseDig): explicit role flags (useful for UI decisions)
      roles: ReturnType<typeof roleFlags>;
    }
  | {
      ok: false;
      reason: RequireAdminReason;

      // (kept optional for compatibility / debugging)
      user?: CurrentUser;

      // ✅ NEW (CourseDig): roles present only when user exists
      roles?: ReturnType<typeof roleFlags>;
    };

export async function requireAdmin(): Promise<RequireAdminResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  const roles = roleFlags(user);

  if (!roles.isAdminOrSuperAdmin) {
    return { ok: false, reason: "FORBIDDEN", user, roles };
  }

  return { ok: true, user, roles };
}

export async function requireAdminApi() {
  const gate = await requireAdmin();

  if (!gate.ok) {
    return {
      ok: false as const,
      status: gate.reason === "UNAUTHENTICATED" ? 401 : 403,
      gate,
      reason: gate.reason,
      // ✅ NEW (CourseDig): consistent user exposure (undefined if not authenticated)
      user: gate.user,
      // ✅ NEW: consistent role flags exposure (undefined if not authenticated)
      roles: gate.roles,
    };
  }

  return {
    ok: true as const,
    status: 200,
    gate,
    user: gate.user,
    roles: gate.roles,
  };
}

/* =========================================================
   ✅ SUPER ADMIN (Top-level role)
   ========================================================= */

export type RequireSuperAdminReason = "UNAUTHENTICATED" | "FORBIDDEN";

export type RequireSuperAdminResult =
  | {
      ok: true;
      user: CurrentUser;

      // ✅ NEW (CourseDig): explicit role flags
      roles: ReturnType<typeof roleFlags>;
    }
  | {
      ok: false;
      reason: RequireSuperAdminReason;
      user?: CurrentUser;

      // ✅ NEW (CourseDig): roles present only when user exists
      roles?: ReturnType<typeof roleFlags>;
    };

export async function requireSuperAdmin(): Promise<RequireSuperAdminResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  const roles = roleFlags(user);

  if (!roles.isSuperAdmin) {
    return { ok: false, reason: "FORBIDDEN", user, roles };
  }

  return { ok: true, user, roles };
}

export async function requireSuperAdminApi() {
  const gate = await requireSuperAdmin();

  if (!gate.ok) {
    return {
      ok: false as const,
      status: gate.reason === "UNAUTHENTICATED" ? 401 : 403,
      gate,
      reason: gate.reason,
      // ✅ NEW (CourseDig): consistent user exposure
      user: gate.user,
      roles: gate.roles,
    };
  }

  return {
    ok: true as const,
    status: 200,
    gate,
    user: gate.user,
    roles: gate.roles,
  };
}

/* =========================================================
   🔐 SECURE ADMIN ACTION (Elevation actions)
   NOTE:
   - Role check ONLY
   - Secondary password is verified inside the API route
   ========================================================= */

export type RequireSecureAdminReason = "UNAUTHENTICATED" | "FORBIDDEN";

export type RequireSecureAdminResult =
  | {
      ok: true;
      user: CurrentUser;

      // ✅ NEW (CourseDig): explicit role flags
      roles: ReturnType<typeof roleFlags>;
    }
  | {
      ok: false;
      reason: RequireSecureAdminReason;
      user?: CurrentUser;

      // ✅ NEW (CourseDig): roles present only when user exists
      roles?: ReturnType<typeof roleFlags>;
    };

export async function requireSecureAdmin(): Promise<RequireSecureAdminResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  const roles = roleFlags(user);

  // ✅ secure admin = super admin only (as you had it)
  if (!roles.isSuperAdmin) {
    return { ok: false, reason: "FORBIDDEN", user, roles };
  }

  return { ok: true, user, roles };
}

export async function requireSecureAdminApi() {
  const gate = await requireSecureAdmin();

  if (!gate.ok) {
    return {
      ok: false as const,
      status: gate.reason === "UNAUTHENTICATED" ? 401 : 403,
      gate,
      reason: gate.reason,
      // ✅ NEW (CourseDig): consistent user exposure
      user: gate.user,
      roles: gate.roles,
    };
  }

  return {
    ok: true as const,
    status: 200,
    gate,
    user: gate.user,
    roles: gate.roles,
  };
}
