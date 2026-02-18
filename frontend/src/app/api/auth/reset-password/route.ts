// frontend/src/app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function validPassword(pw: string) {
  return typeof pw === "string" && pw.length >= 8 && pw.length <= 200;
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const token = String(body.token ?? "").trim();
    const newPassword = String(body.password ?? "");

    if (!token) {
      return NextResponse.json({ message: "Missing reset token." }, { status: 400 });
    }

    if (!validPassword(newPassword)) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const tokenHash = sha256Hex(token);

    const rec = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        expiresAt: true,
        usedAt: true,
        user: { select: { email: true } },
      },
    });

    const expired =
      !rec?.expiresAt || rec.expiresAt.getTime() < Date.now();

    if (!rec || rec.usedAt || expired) {
      return NextResponse.json(
        { message: "This reset link is invalid or has expired." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: rec.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: rec.id },
        data: { usedAt: new Date() },
      }),
      prisma.session.deleteMany({
        where: { userId: rec.userId },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { userId: rec.userId, id: { not: rec.id } },
      }),
    ]);

    return NextResponse.json(
      { success: true, email: rec.user.email },
      { status: 200 }
    );
  } catch (e) {
    console.error("RESET_PASSWORD_ERROR:", e);
    return NextResponse.json({ message: "Password reset failed." }, { status: 500 });
  }
}
