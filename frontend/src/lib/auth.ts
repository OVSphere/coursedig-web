// frontend/src/lib/auth.ts
import "server-only";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "coursedig_session";

const SESSION_TTL_DAYS = Number(process.env.SESSION_TTL_DAYS ?? 14);

function sessionExpiryDate() {
  const d = new Date();
  d.setDate(d.getDate() + (Number.isFinite(SESSION_TTL_DAYS) ? SESSION_TTL_DAYS : 14));
  return d;
}

function getCookieDomain(): string | undefined {
  const d = (process.env.APP_COOKIE_DOMAIN || "").trim();
  return d ? d : undefined;
}

function buildSessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
    domain: getCookieDomain(),
  };
}

export function buildClearSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(0),
    domain: getCookieDomain(),
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

/**
 * ✅ For "secondary admin password" (stored as adminSecondFactorHash).
 */
export async function hashAdminSecondFactor(secret: string) {
  return bcrypt.hash(secret, 12);
}

export async function verifyAdminSecondFactor(secret: string, hash: string) {
  return bcrypt.compare(secret, hash);
}

export async function createSession(userId: string) {
  const expiresAt = sessionExpiryDate();

  const session = await prisma.session.create({
    data: { userId, expiresAt },
    select: { id: true, expiresAt: true },
  });

  // ✅ Next.js 16: cookies() is async
  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    session.id,
    buildSessionCookieOptions(session.expiresAt)
  );

  return session;
}

export async function destroySession() {
  // ✅ Next.js 16: cookies() is async
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", buildClearSessionCookieOptions());
}

/**
 * Returns the currently logged-in user (or null).
 * ✅ Includes: isSuperAdmin, emailVerifiedAt, hasAdminSecondFactor
 * ✅ Includes identity fields used for auto-fill
 * ❌ Does NOT expose adminSecondFactorHash
 */
export async function getCurrentUser() {
  // ✅ Next.js 16: cookies() is async
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          createdAt: true,
          emailVerifiedAt: true,
          isAdmin: true,
          isSuperAdmin: true,
          adminSecondFactorHash: true, // only to compute boolean

          firstName: true,
          lastName: true,
          phoneNumber: true,
          dateOfBirth: true,
          profileLockedAt: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await destroySession();
    return null;
  }

  const u = session.user;

  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    createdAt: u.createdAt,
    emailVerifiedAt: u.emailVerifiedAt,
    isAdmin: u.isAdmin,
    isSuperAdmin: u.isSuperAdmin,
    hasAdminSecondFactor: !!u.adminSecondFactorHash,

    firstName: u.firstName ?? null,
    lastName: u.lastName ?? null,
    phoneNumber: u.phoneNumber ?? null,
    dateOfBirth: u.dateOfBirth ?? null,
    profileLockedAt: u.profileLockedAt ?? null,
  };
}
