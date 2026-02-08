// frontend/src/app/api/auth/me/route.ts
// NOTE (CourseDig update - return identity fields safely)
// ✅ Exposes identity/profile fields for UI auto-fill + lock behaviour
// ✅ Still avoids exposing adminSecondFactorHash

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          createdAt: user.createdAt.toISOString(),

          emailVerifiedAt: user.emailVerifiedAt
            ? user.emailVerifiedAt.toISOString()
            : null,

          isAdmin: !!user.isAdmin,
          isSuperAdmin: !!user.isSuperAdmin,

          // ✅ identity/profile fields
          firstName: user.firstName ?? null,
          lastName: user.lastName ?? null,
          phoneNumber: user.phoneNumber ?? null,
          dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null,
          profileLockedAt: user.profileLockedAt
            ? user.profileLockedAt.toISOString()
            : null,

          // ✅ UI should use this boolean (do NOT expose hash)
          hasAdminSecondFactor: !!user.hasAdminSecondFactor,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("AUTH_ME_ERROR:", e);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
