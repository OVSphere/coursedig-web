// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { verifyTurnstile } from "@/lib/turnstile";

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function safeRedirect(next: unknown) {
  const n = String(next ?? "/").trim();
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = String(body.email ?? "").toLowerCase().trim();
    const password = String(body.password ?? "");
    const next = safeRedirect(body.next);

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

    // Basic validation (neutral wording: avoid enumeration)
    if (!isEmailLike(email) || !password) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        emailVerifiedAt: true,
        // you can select these later if the client needs it
        // isAdmin: true,
        // isSuperAdmin: true,
      },
    });

    // Avoid user enumeration
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // ✅ Allow login even if unverified
    await createSession(user.id);

    const verified = !!user.emailVerifiedAt;

    const res = NextResponse.json(
      {
        success: true,
        verified,
        requiresVerification: !verified,
      },
      { status: 200 }
    );

    // ✅ Let the client know where it *wanted* to go
    // Client should override redirect to /verify-email-gate if requiresVerification=true
    res.headers.set("X-Redirect-To", next);

    return res;
  } catch (e) {
    console.error("LOGIN_ERROR:", e);
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
