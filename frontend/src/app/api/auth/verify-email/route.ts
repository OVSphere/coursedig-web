// frontend/src/app/api/auth/verify-email/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashVerificationToken } from "@/lib/emailVerification";

export const dynamic = "force-dynamic";

function json(message: string, status: number, extra?: Record<string, any>) {
  return NextResponse.json({ message, ...(extra || {}) }, { status });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawToken = String(body.token ?? "").trim();

    if (!rawToken) {
      return json("Missing verification token.", 400, { code: "TOKEN_MISSING" });
    }

    const tokenHash = hashVerificationToken(rawToken);

    const tokenRow = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: { userId: true, expiresAt: true },
    });

    // ✅ Neutral language (don’t reveal if token ever existed)
    if (!tokenRow) {
      return json("This verification link is invalid or has expired.", 400, {
        code: "TOKEN_INVALID",
      });
    }

    // Expired token (delete it for cleanliness)
    if (tokenRow.expiresAt.getTime() < Date.now()) {
      await prisma.emailVerificationToken
        .delete({ where: { tokenHash } })
        .catch(() => {});
      return json("This verification link is invalid or has expired.", 400, {
        code: "TOKEN_EXPIRED",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenRow.userId },
      select: { id: true, emailVerifiedAt: true },
    });

    // ✅ Neutral language (don’t reveal user existence)
    if (!user) {
      await prisma.emailVerificationToken
        .delete({ where: { tokenHash } })
        .catch(() => {});
      return json("This verification link is invalid or has expired.", 400, {
        code: "TOKEN_INVALID",
      });
    }

    // ✅ Idempotent: already verified => delete token and return OK
    if (user.emailVerifiedAt) {
      await prisma.emailVerificationToken
        .delete({ where: { tokenHash } })
        .catch(() => {});
      return json("Email already verified. You can continue to login.", 200, {
        verified: true,
        alreadyVerified: true,
        code: "ALREADY_VERIFIED",
      });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
      prisma.emailVerificationToken.delete({ where: { tokenHash } }),
    ]);

    return json("Email verified successfully. You can continue to login.", 200, {
      verified: true,
      alreadyVerified: false,
      code: "OK",
    });
  } catch (e) {
    console.error("VERIFY_EMAIL_ERROR:", e);
    return json("Verification failed.", 500, { code: "SERVER_ERROR" });
  }
}
