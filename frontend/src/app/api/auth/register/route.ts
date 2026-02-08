// src/app/api/auth/register/route.ts
// NOTE (CourseDig update - Identity fields + profile lock):
// 2026-02-07
// ✅ Added mandatory identity fields (firstName/lastName/phoneNumber/dateOfBirth)
// ✅ Persist identity fields on User + set profileLockedAt by default
// ✅ Added devVerifyUrl for UI compatibility (without breaking existing devVerifyLink)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { verifyTurnstile } from "@/lib/turnstile";

// ✅ CHANGE (CourseDig): helpers for new mandatory identity fields
function normaliseSpaces(v: string) {
  return (v || "").replace(/\s+/g, " ").trim();
}

// ✅ CHANGE (CourseDig): basic phone validation (len + allowed chars)
function isPhoneLike(v: string) {
  const s = normaliseSpaces(v);
  const digits = s.replace(/\D/g, "");
  const allowed = /^[+()\-\s0-9]+$/.test(s);
  return allowed && digits.length >= 10 && digits.length <= 15;
}

// ✅ CHANGE (CourseDig): parse DOB from YYYY-MM-DD (from <input type="date" />)
function parseDob(dateStr: string): Date | null {
  const v = (dateStr || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;

  const d = new Date(`${v}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;

  // must be in the past (not today / future)
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  if (d.getTime() >= todayUTC.getTime()) return null;

  return d;
}

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const MIN_PASSWORD_LEN = 8;

// 24 hours default (you can change)
const VERIFY_TOKEN_TTL_HOURS = Number(process.env.VERIFY_TOKEN_TTL_HOURS ?? 24);

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function getBaseUrl(req: Request) {
  // Prefer explicit envs (best for production)
  const envUrl =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (envUrl) return envUrl.replace(/\/+$/, "");

  // Fallback: derive from request headers (works locally)
  const proto = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.fullName ?? "").trim();

    // ✅ CHANGE (CourseDig): NEW mandatory identity fields from registration
    const firstName = normaliseSpaces(String(body.firstName ?? ""));
    const lastName = normaliseSpaces(String(body.lastName ?? ""));
    const phoneNumber = normaliseSpaces(String(body.phoneNumber ?? ""));
    const dob = parseDob(String(body.dateOfBirth ?? ""));

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

    // ✅ CHANGE (CourseDig): server-side enforcement of mandatory identity fields
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
      select: { id: true, emailVerifiedAt: true },
    });

    if (exists) {
      return NextResponse.json(
        { message: "Email already registered. Please login." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ CHANGE (CourseDig): derive fullName from first/last if not provided
    const derivedFullName = fullName || normaliseSpaces(`${firstName} ${lastName}`);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        fullName: derivedFullName || null,
        passwordHash,
        emailVerifiedAt: null,

        // ✅ CHANGE (CourseDig): persist identity fields on User for auto-fill
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth: dob,

        // ✅ CHANGE (CourseDig): lock profile identity fields by default (admin-only edits)
        profileLockedAt: new Date(),
      },
      select: { id: true, email: true },
    });

    // Create verification token record (no dependency on emailVerification.ts)
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

    /**
     * EMAIL SENDING
     * - DEV: log the verification link (so you can click it)
     * - PROD: you should send a real email (we will add SES / Resend / etc)
     */
    const isProd = process.env.NODE_ENV === "production";

    if (!isProd) {
      console.log("DEV EMAIL (verification link):", verifyLink);
    } else {
      const hasSenderConfigured =
        !!process.env.AWS_REGION &&
        !!process.env.AWS_ACCESS_KEY_ID &&
        !!process.env.AWS_SECRET_ACCESS_KEY &&
        !!process.env.SES_FROM_EMAIL;

      if (!hasSenderConfigured) {
        // rollback so users don’t get stuck
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

        // ✅ CHANGE (CourseDig): keep existing key, and also add devVerifyUrl (UI-friendly)
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
