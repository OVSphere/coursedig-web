// src/app/api/newsletter/subscribe/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTurnstile } from "@/lib/turnstile";

// If you want captcha required only in production:
const ENFORCE_CAPTCHA_IN_PROD = true;

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!isEmailLike(email)) {
      return NextResponse.json({ message: "Enter a valid email." }, { status: 400 });
    }

    // ✅ Turnstile like login
    const isProd = process.env.NODE_ENV === "production";
    if (ENFORCE_CAPTCHA_IN_PROD ? isProd : true) {
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
    }

    try {
      await prisma.newsletterSubscriber.create({
        data: {
          email,
          isActive: true,
        },
        select: { id: true },
      });

      return NextResponse.json({ status: "subscribed" }, { status: 200 });
    } catch (e: any) {
      // ✅ Prisma unique constraint violation
      if (e?.code === "P2002") {
        return NextResponse.json({ status: "already_subscribed" }, { status: 409 });
      }

      console.error("NEWSLETTER_SUBSCRIBE_DB_ERROR:", e);
      return NextResponse.json(
        { message: "Subscribe failed. Please try again." },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("NEWSLETTER_SUBSCRIBE_ERROR:", e);
    return NextResponse.json({ message: "Subscribe failed." }, { status: 500 });
  }
}
