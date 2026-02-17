//frontend/src/app/api/auth/resend-verification/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { emailConfigured, sendEmail } from "@/lib/mailer";

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const VERIFY_TOKEN_TTL_MINUTES = Number(
  process.env.VERIFY_TOKEN_TTL_MINUTES ?? 10
);

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getBaseUrl(req: Request) {
  const envUrl =
    process.env.APP_BASE_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (envUrl) return envUrl.replace(/\/+$/, "");

  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost:3000";

  return `${proto}://${host}`.replace(/\/+$/, "");
}

function buildResendHtml(params: { verifyLink: string; firstName?: string }) {
  const name = (params.firstName || "").trim();
  const greeting = name ? `Hi ${name},` : "Hi,";
  const link = params.verifyLink;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #111;">
    <h2 style="margin:0 0 12px 0;">Verify your email</h2>
    <p style="margin:0 0 12px 0;">${greeting}</p>
    <p style="margin:0 0 12px 0;">Here is your new verification link:</p>
    <p style="margin:18px 0;">
      <a href="${link}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;">
        Verify email
      </a>
    </p>
    <p style="margin:0 0 12px 0;">
      If the button doesn’t work, copy and paste this link into your browser:
      <br />
      <a href="${link}">${link}</a>
    </p>
    <p style="margin:18px 0 0 0;font-size:12px;color:#555;">
      If you didn’t request this, you can ignore this email.
    </p>
  </div>
  `.trim();
}

function minutesFromEnv(v: number) {
  return Number.isFinite(v) && v > 0 ? v : 10;
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const neutralOk =
    "If an account exists for this email, a verification link has been sent.";

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!isEmailLike(email)) {
      return NextResponse.json({ message: "Enter a valid email." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailVerifiedAt: true, firstName: true },
    });

    // Neutral response for: no user OR already verified
    if (!user || user.emailVerifiedAt) {
      return NextResponse.json({ message: neutralOk }, { status: 200 });
    }

    // Clear old tokens for this user (keeps DB tidy)
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256Hex(rawToken);

    const minutes = minutesFromEnv(VERIFY_TOKEN_TTL_MINUTES);
    const expiresAt = new Date(Date.now() + minutes * 60_000);

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl = getBaseUrl(req);
    const verifyLink = `${baseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;

    const isProd = process.env.NODE_ENV === "production";

    // Non-prod: return link for easy testing
    if (!isProd) {
      console.log("DEV RESEND VERIFY LINK:", verifyLink);
      return NextResponse.json(
        { message: neutralOk, devVerifyLink: verifyLink, devVerifyUrl: verifyLink },
        { status: 200 }
      );
    }

    // Prod: never block the user if SMTP isn't configured
    if (!emailConfigured()) {
      console.warn("RESEND_VERIFY_EMAIL_NOT_CONFIGURED: skipping email send", {
        email,
        userId: user.id,
      });
      return NextResponse.json({ message: neutralOk }, { status: 200 });
    }

    try {
      await sendEmail({
        to: email,
        subject: "Your CourseDig verification link",
        html: buildResendHtml({ verifyLink, firstName: user.firstName || undefined }),
        text: `Verify your email: ${verifyLink}`,
      });
    } catch (e: any) {
      // Do not fail flow if email sending fails
      console.error("RESEND_VERIFY_EMAIL_SEND_FAILED:", e?.name, e?.message || e);
    }

    return NextResponse.json({ message: neutralOk }, { status: 200 });
  } catch (e: any) {
    console.error("RESEND_VERIFY_ERROR:", e?.name, e?.message || e);
    // Always return neutral OK to avoid account enumeration
    return NextResponse.json({ message: neutralOk }, { status: 200 });
  }
}
