//frontend/src/app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { verifyTurnstile } from "@/lib/turnstile";
import { emailConfigured, sendEmail } from "@/lib/mailer";

function normaliseSpaces(v: string) {
  return (v || "").replace(/\s+/g, " ").trim();
}

function isPhoneLike(v: string) {
  const s = normaliseSpaces(v);
  const digits = s.replace(/\D/g, "");
  const allowed = /^[+()\-\s0-9]+$/.test(s);
  return allowed && digits.length >= 10 && digits.length <= 15;
}

function parseDob(dateStr: string): Date | null {
  const v = (dateStr || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;

  const d = new Date(`${v}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;

  const today = new Date();
  const todayUTC = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  if (d.getTime() >= todayUTC.getTime()) return null;

  return d;
}

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const MIN_PASSWORD_LEN = 8;
const VERIFY_TOKEN_TTL_HOURS = Number(process.env.VERIFY_TOKEN_TTL_HOURS ?? 24);

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
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

function buildVerifyEmailHtml(params: {
  firstName?: string;
  verifyLink: string;
  baseUrl: string;
}) {
  const name = (params.firstName || "").trim();
  const greeting = name ? `Hi ${name},` : "Hi,";
  const link = params.verifyLink;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #111;">
    <h2 style="margin:0 0 12px 0;">Verify your email</h2>
    <p style="margin:0 0 12px 0;">${greeting}</p>
    <p style="margin:0 0 12px 0;">
      Thanks for creating your CourseDig account. Please verify your email address by clicking the button below:
    </p>
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
      If you didn’t create an account, you can ignore this email.
    </p>
  </div>
  `.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "").trim();

    const firstName = normaliseSpaces(String(body.firstName ?? ""));
    const lastName = normaliseSpaces(String(body.lastName ?? ""));
    const phoneNumber = normaliseSpaces(String(body.phoneNumber ?? ""));
    const dob = parseDob(String(body.dateOfBirth ?? ""));

    const captchaToken = String(body.captchaToken ?? "");

    // ✅ FIX: use first IP only (x-forwarded-for often contains a list)
    const ipRaw =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      null;

    const ip =
      typeof ipRaw === "string" ? ipRaw.split(",")[0].trim() : (ipRaw as any);

    const captcha = await verifyTurnstile(captchaToken, ip);
    if (!captcha.ok) {
      return NextResponse.json(
        { message: captcha.message || "Captcha verification failed. Please try again." },
        { status: 400 }
      );
    }

    if (firstName.length < 2) {
      return NextResponse.json({ message: "Please enter your first name." }, { status: 400 });
    }
    if (lastName.length < 2) {
      return NextResponse.json({ message: "Please enter your last name." }, { status: 400 });
    }
    if (!isPhoneLike(phoneNumber)) {
      return NextResponse.json({ message: "Please enter a valid phone number." }, { status: 400 });
    }
    if (!dob) {
      return NextResponse.json({ message: "Please enter a valid date of birth." }, { status: 400 });
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

    const exists = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (exists) {
      return NextResponse.json(
        { message: "Email already registered. Please login." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const derivedFullName = fullName || normaliseSpaces(`${firstName} ${lastName}`);

    const user = await prisma.user.create({
      data: {
        email,
        fullName: derivedFullName || null,
        passwordHash,
        emailVerifiedAt: null,

        firstName,
        lastName,
        phoneNumber,
        dateOfBirth: dob,

        profileLockedAt: new Date(),
      },
      select: { id: true, email: true },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256Hex(rawToken);

    const expiresAt = new Date();
    expiresAt.setHours(
      expiresAt.getHours() + (Number.isFinite(VERIFY_TOKEN_TTL_HOURS) ? VERIFY_TOKEN_TTL_HOURS : 24)
    );

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

    if (!isProd) {
      console.log("DEV EMAIL (verification link):", verifyLink);
    } else {
      if (!emailConfigured()) {
        await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
        return NextResponse.json(
          { message: "Email service is not configured. Please try again later." },
          { status: 500 }
        );
      }

      const subject = "Verify your CourseDig email";
      const html = buildVerifyEmailHtml({
        firstName,
        verifyLink,
        baseUrl,
      });

      try {
        await sendEmail({
          to: email,
          subject,
          html,
          text: `Verify your email: ${verifyLink}`,
        });
      } catch (sendErr) {
        console.error("REGISTER_EMAIL_SEND_ERROR:", sendErr);

        await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }).catch(() => {});
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {});

        return NextResponse.json(
          { message: "Email service is not configured. Please try again later." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Account created. Please check your email to verify your address before applying.",
        ...(process.env.NODE_ENV !== "production"
          ? { devVerifyLink: verifyLink, devVerifyUrl: verifyLink }
          : {}),
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("REGISTER_ERROR:", e);
    return NextResponse.json({ message: "Registration failed." }, { status: 500 });
  }
}
