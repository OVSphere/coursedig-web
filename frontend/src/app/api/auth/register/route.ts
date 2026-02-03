// src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  createEmailVerification,
  sendVerificationEmail,
} from "@/lib/emailVerification";

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const MIN_PASSWORD_LEN = 8;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "").trim();

    // CAPTCHA
    const captchaToken = String(body.captchaToken ?? "");
    const ip =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      null;

    const captcha = await verifyTurnstile(captchaToken, ip);
    if (!captcha.ok) {
      return NextResponse.json(
        { message: captcha.message || "Captcha verification failed." },
        { status: 400 }
      );
    }

    if (!isEmailLike(email)) {
      return NextResponse.json({ message: "Enter a valid email." }, { status: 400 });
    }

    if (password.length < MIN_PASSWORD_LEN) {
      return NextResponse.json(
        { message: `Password must be at least ${MIN_PASSWORD_LEN} characters.` },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) {
      return NextResponse.json(
        { message: "Email already registered. Please login." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        fullName: fullName || null,
        passwordHash,
        emailVerifiedAt: null,
      },
      select: { id: true, email: true },
    });

    const token = await createEmailVerification(user.id);
    await sendVerificationEmail(user.email, token);

    return NextResponse.json(
      {
        message:
          "Account created. Please check your email to verify your address before applying.",
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("REGISTER_ERROR:", e);
    return NextResponse.json({ message: "Registration failed." }, { status: 500 });
  }
}
