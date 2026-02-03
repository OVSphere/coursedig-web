// src/app/api/auth/resend-verification/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";
import { createEmailVerification, sendVerificationEmail } from "@/lib/emailVerification";

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();

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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerifiedAt: true },
    });

    // Avoid enumeration
    const genericOk =
      "If your email is registered, you’ll receive a verification link shortly.";

    if (!user) {
      return NextResponse.json({ message: genericOk }, { status: 200 });
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json(
        { message: "Your email is already verified. You can login now." },
        { status: 200 }
      );
    }

    const token = await createEmailVerification(user.id);

    try {
      const sent = await sendVerificationEmail(email, token);

      // ✅ DEV mode: expose link to help testing fast
      if (sent?.mode === "console" && sent.link) {
        return NextResponse.json(
          { message: "DEV mode: verification link generated.", devVerifyLink: sent.link },
          { status: 200 }
        );
      }
    } catch (err) {
      console.error("RESEND_VERIFY_EMAIL_SEND_ERROR:", err);
      // still return generic ok to avoid enumeration
      return NextResponse.json({ message: genericOk }, { status: 200 });
    }

    return NextResponse.json(
      { message: "Verification email resent. Please check your inbox." },
      { status: 200 }
    );
  } catch (e) {
    console.error("RESEND_VERIFY_ERROR:", e);
    return NextResponse.json({ message: "Request failed." }, { status: 500 });
  }
}
