// src/app/api/auth/resend-verification/route.ts
import { NextResponse } from "next/server";
import { verifyTurnstile } from "@/lib/turnstile";
import { resendVerificationEmailNeutral } from "@/lib/emailVerification";

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const next = String(body.next ?? "/apply").trim() || "/apply";

    const captchaToken = String(body.captchaToken ?? "");
    const ipRaw =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      null;

    // take first IP if x-forwarded-for includes a list
    const ip =
      typeof ipRaw === "string" ? ipRaw.split(",")[0].trim() : (ipRaw as any);

    // ✅ Turnstile required (per spec)
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

    // ✅ Neutral confirmation to prevent account enumeration
    const neutralOk =
      "If an account exists for this email, a verification link has been sent.";

    // ✅ Use the shared helper:
    // - rate limits (IP/email)
    // - logs resend attempts
    // - sends only if user exists + unverified
    const result = await resendVerificationEmailNeutral({
      email,
      next,
      ipAddress: ip,
    });

    if (result && "ok" in result && result.ok === false) {
      // Rate limiting path
      return NextResponse.json(
        { message: result.message || "Too many requests. Please try again later." },
        { status: result.status || 429 }
      );
    }

    // DEV: return link if console mode produced one
    if ((result as any)?.mode === "console" && (result as any)?.link) {
      return NextResponse.json(
        {
          message: neutralOk,
          devVerifyLink: (result as any).link,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: neutralOk }, { status: 200 });
  } catch (e) {
    console.error("RESEND_VERIFY_ERROR:", e);
    // Still avoid leaking anything
    return NextResponse.json(
      { message: "If an account exists for this email, a verification link has been sent." },
      { status: 200 }
    );
  }
}
