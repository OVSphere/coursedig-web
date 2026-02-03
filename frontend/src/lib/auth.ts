// src/lib/auth.ts
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

export function buildClearSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(0),
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const expiresAt = sessionExpiryDate();

  const session = await prisma.session.create({
    data: { userId, expiresAt },
    select: { id: true, expiresAt: true },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: session.expiresAt,
  });

  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    await prisma.session.deleteMany({ where: { id: sessionId } });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", buildClearSessionCookieOptions());
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) return null;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      expiresAt: true,
      user: { select: { id: true, email: true, fullName: true, createdAt: true } },
    },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await destroySession();
    return null;
  }

  return session.user;
}
