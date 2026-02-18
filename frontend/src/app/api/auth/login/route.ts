// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth";

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function safeRedirect(next: unknown) {
  const n = String(next ?? "/").trim();
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

function normaliseEmail(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function getCookieDomain() {
  const d = (process.env.APP_COOKIE_DOMAIN || "").trim();
  return d ? d : undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const email = normaliseEmail(body.email);
    const password = String(body.password ?? "");
    const next = safeRedirect(body.next);

    if (!isEmailLike(email) || !password) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        passwordHash: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Create session in DB
    const session = await createSession(user.id);

    const verified = !!user.emailVerifiedAt;

    // Build response
    const res = NextResponse.json(
      {
        success: true,
        verified,
        requiresVerification: !verified,
        next,
      },
      { status: 200 }
    );

    // ✅ Explicitly set cookie on this response (prevents host/subdomain weirdness)
    res.cookies.set(SESSION_COOKIE_NAME, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: session.expiresAt,
      ...(getCookieDomain() ? { domain: getCookieDomain() } : {}),
    });

    res.headers.set("X-Redirect-To", next);
    return res;
  } catch (e: any) {
    console.error("LOGIN_ERROR:", e?.name, e?.message || e);
    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
