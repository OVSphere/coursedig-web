// src/lib/emailVerification.ts
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * ✅ Requirements covered here:
 * - Tokens expire in 5 minutes
 * - Single-use (token row is deleted on success by verify-email route)
 * - Issuing a new token invalidates previous ones (deleteMany)
 * - DEV_EMAIL_MODE=console prints link and avoids AWS SDK install/build issues
 * - Resend tracking + rate limit helpers (IP + email)
 *
 * NOTE:
 * - Neutral “If an account exists…” messaging is enforced by API routes/UI,
 *   not by this library (this file returns structured results so routes can
 *   respond neutrally).
 */

// ✅ Prisma will store only a hash, never the raw token
function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function getBaseUrl() {
  return normalizeBaseUrl(process.env.APP_BASE_URL || "http://localhost:3000");
}

function isDevConsoleMode() {
  return (
    process.env.NODE_ENV !== "production" &&
    (process.env.DEV_EMAIL_MODE || "").toLowerCase() === "console"
  );
}

// ✅ Requirement: 5-minute verification tokens
export const VERIFICATION_TOKEN_TTL_MS = 5 * 60 * 1000;

// ✅ Rate limit requirements
const RESEND_IP_LIMIT = 5; // max 5 per 10 minutes
const RESEND_IP_WINDOW_MS = 10 * 60 * 1000;

const RESEND_EMAIL_LIMIT = 3; // max 3 per hour
const RESEND_EMAIL_WINDOW_MS = 60 * 60 * 1000;

function normalizeEmail(email: string) {
  return String(email || "").trim().toLowerCase();
}

export function buildVerifyEmailLink(rawToken: string, next?: string) {
  const baseUrl = getBaseUrl();
  const qp = new URLSearchParams();
  qp.set("token", rawToken);
  if (next) qp.set("next", next);
  return `${baseUrl}/verify-email?${qp.toString()}`;
}

/**
 * Create a new single-use verification token:
 * - expires in 5 minutes
 * - invalidates (deletes) any previous tokens for that user
 * - stores ONLY the hashed token in DB
 */
export async function createEmailVerification(userId: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS);

  // ✅ Requirement: issuing a new token invalidates old ones
  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return rawToken;
}

/**
 * Logs a resend attempt for rate limiting / abuse prevention.
 * Safe to call even if userId is unknown.
 */
export async function logVerificationResendAttempt(args: {
  email: string;
  userId?: string | null;
  ipAddress?: string | null;
}) {
  const email = normalizeEmail(args.email);
  if (!email) return;

  // If your schema includes EmailVerificationResendAttempt, this will work.
  // If it doesn't exist yet, it will throw — so call only after migration.
  await prisma.emailVerificationResendAttempt.create({
    data: {
      email,
      userId: args.userId || null,
      ipAddress: args.ipAddress || null,
    },
  });
}

/**
 * Checks rate limits:
 * - IP-based: max 5 per 10 minutes
 * - Email-based: max 3 per hour
 *
 * Returns { ok: true } or { ok: false, status: 429, message: ... }
 */
export async function checkVerificationResendRateLimit(args: {
  email: string;
  ipAddress?: string | null;
  userId?: string | null;
}) {
  const email = normalizeEmail(args.email);
  const ip = (args.ipAddress || "").split(",")[0]?.trim() || null;

  const now = Date.now();

  // Email-based limit
  if (email) {
    const since = new Date(now - RESEND_EMAIL_WINDOW_MS);
    const emailCount = await prisma.emailVerificationResendAttempt.count({
      where: {
        email,
        createdAt: { gte: since },
      },
    });

    if (emailCount >= RESEND_EMAIL_LIMIT) {
      return {
        ok: false as const,
        status: 429 as const,
        message: "Too many requests. Please try again later.",
      };
    }
  }

  // IP-based limit
  if (ip) {
    const since = new Date(now - RESEND_IP_WINDOW_MS);
    const ipCount = await prisma.emailVerificationResendAttempt.count({
      where: {
        ipAddress: ip,
        createdAt: { gte: since },
      },
    });

    if (ipCount >= RESEND_IP_LIMIT) {
      return {
        ok: false as const,
        status: 429 as const,
        message: "Too many requests. Please try again later.",
      };
    }
  }

  return { ok: true as const };
}

/**
 * Resend helper (library only):
 * - Finds the user (if exists)
 * - If user exists and is unverified => issues new token (invalidating old) and sends email
 * - Always returns a NEUTRAL result so routes can avoid account enumeration
 *
 * NOTE: Turnstile verification must be done in the API route before calling this.
 */
export async function resendVerificationEmailNeutral(args: {
  email: string;
  next?: string;
  ipAddress?: string | null;
  userAgent?: string | null; // (kept for future, not stored here)
}) {
  const email = normalizeEmail(args.email);
  if (!email) {
    // Still return neutral
    return { ok: true as const, sent: false as const, mode: "none" as const };
  }

  // Rate-limit check (neutral message handled by route/UI)
  const rl = await checkVerificationResendRateLimit({
    email,
    ipAddress: args.ipAddress || null,
  });
  if (!rl.ok) {
    // Still neutral, but caller can show 429 message
    return { ok: false as const, status: rl.status, message: rl.message };
  }

  // Find user without revealing anything to the caller (caller must respond neutrally)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerifiedAt: true, email: true },
  });

  // Log attempt regardless (prevents probing)
  await logVerificationResendAttempt({
    email,
    userId: user?.id || null,
    ipAddress: args.ipAddress || null,
  });

  // If user doesn't exist OR already verified → do nothing, but return neutral ok
  if (!user || user.emailVerifiedAt) {
    return { ok: true as const, sent: false as const, mode: "none" as const };
  }

  const rawToken = await createEmailVerification(user.id);
  const link = buildVerifyEmailLink(rawToken, args.next);
  const sendResult = await sendVerificationEmail(user.email, rawToken, args.next);

  // In console mode we return the link for dev UX; production caller should ignore link
  return {
    ok: true as const,
    sent: true as const,
    mode: sendResult.mode,
    link: sendResult.mode === "console" ? link : undefined,
  };
}

/**
 * Send the verification email.
 * - In DEV console mode, prints the link (no AWS dependency)
 * - In production, requires SES env vars and uses dynamic import
 *   so local builds don't fail if AWS SDK isn't installed.
 */
export async function sendVerificationEmail(
  to: string,
  rawToken: string,
  next?: string
) {
  const link = buildVerifyEmailLink(rawToken, next);

  // ✅ DEV convenience
  if (isDevConsoleMode()) {
    console.log("✅ DEV EMAIL (verification link):", link);
    return { mode: "console" as const, link };
  }

  // ✅ Only load AWS SDK when actually needed (prevents build error locally)
  const { SESClient, SendEmailCommand } = await import("@aws-sdk/client-ses");

  const AWS_REGION =
    process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
  const from = process.env.SES_FROM_EMAIL;

  if (!from) throw new Error("SES_FROM_EMAIL is not set");

  const ses = new SESClient({ region: AWS_REGION });

  const subject = "Verify your CourseDig email";
  const text =
    `Welcome to CourseDig.\n\n` +
    `Please verify your email address to continue:\n${link}\n\n` +
    `This link expires in 5 minutes.\n`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Verify your email</h2>
      <p>Please verify your email address to continue.</p>
      <p><a href="${link}">Verify email</a></p>
      <p style="font-size: 12px; color: #666;">This link expires in 5 minutes.</p>
    </div>
  `;

  await ses.send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: html, Charset: "UTF-8" },
          Text: { Data: text, Charset: "UTF-8" },
        },
      },
    })
  );

  return { mode: "ses" as const };
}

export function hashVerificationToken(rawToken: string) {
  return sha256(rawToken);
}
