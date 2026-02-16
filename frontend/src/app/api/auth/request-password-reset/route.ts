// frontend/src/app/api/auth/request-password-reset/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { emailConfigured, sendEmail } from "@/lib/mailer";

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const RESET_TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES ?? 30);

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getClientIp(req: Request): string | null {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf && cf.trim()) return cf.trim();

  const xff = req.headers.get("x-forwarded-for");
  if (xff && xff.trim()) return xff.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();

  return null;
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

function buildResetHtml(params: { resetLink: string; firstName?: string }) {
  const name = (params.firstName || "").trim();
  const greeting = name ? `Hi ${name},` : "Hi,";
  const link = params.resetLink;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #111;">
    <h2 style="margin:0 0 12px 0;">Password reset</h2>
    <p style="margin:0 0 12px 0;">${greeting}</p>
    <p style="margin:0 0 12px 0;">
      We received a request to reset your CourseDig password.
    </p>
    <p style="margin:18px 0;">
      <a href="${link}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;text-decoration:none;border-radius:8px;">
        Reset password
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

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const neutralOk =
    "If an account exists for this email, a password reset link has been sent.";

  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();

    const ip = getClientIp(req);

    if (!isEmailLike(email)) {
      return NextResponse.json({ message: "Enter a valid email." }, { status: 400 });
    }

    const isProd = process.env.NODE_ENV === "production";
    if (isProd && !emailConfigured()) {
      return NextResponse.json(
        { message: "Email service is not configured. Please try again later." },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true },
    });

    // Record attempt (do not block flow if it fails)
    // NOTE: Prisma client property name is based on model name (PascalCase -> camelCase)
    // Model: PasswordResetRequestAttempt -> prisma.passwordResetRequestAttempt
    await prisma.passwordResetRequestAttempt
      .create({
        data: {
          userId: user?.id ?? null,
          email,
          ipAddress: ip,
        },
      })
      .catch(() => {});

    // Neutral response (no enumeration)
    if (!user) {
      return NextResponse.json({ message: neutralOk }, { status: 200 });
    }

    // Clean old tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256Hex(rawToken);

    const minutes = Number.isFinite(RESET_TOKEN_TTL_MINUTES) ? RESET_TOKEN_TTL_MINUTES : 30;
    const safeMinutes = Math.max(1, Math.min(minutes, 60 * 24)); // clamp 1 min .. 24h
    const expiresAt = new Date(Date.now() + safeMinutes * 60_000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const baseUrl = getBaseUrl(req);
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

    if (!isProd) {
      console.log("DEV PASSWORD RESET LINK:", resetLink);
      return NextResponse.json({ message: neutralOk, devResetLink: resetLink }, { status: 200 });
    }

    try {
      await sendEmail({
        to: email,
        subject: "Password reset",
        html: buildResetHtml({ resetLink, firstName: user.firstName || undefined }),
        text: `Reset your password: ${resetLink}`,
      });
    } catch (sendErr) {
      console.error("PASSWORD_RESET_EMAIL_SEND_ERROR:", sendErr);
      return NextResponse.json(
        { message: "Email service is not configured. Please try again later." },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: neutralOk }, { status: 200 });
  } catch (e) {
    console.error("REQUEST_PASSWORD_RESET_ERROR:", e);
    return NextResponse.json({ message: neutralOk }, { status: 200 });
  }
}
