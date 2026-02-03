// src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "coursedig_session";

function isProtectedPath(pathname: string) {
  // Normalise trailing slashes
  const p = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

  return (
    p === "/apply" ||
    p.startsWith("/apply/") ||
    p === "/scholarships/apply" ||
    p.startsWith("/scholarships/apply/") ||
    p === "/admin" ||
    p.startsWith("/admin/") ||
    p === "/api/applications" ||
    p.startsWith("/api/applications/")
  );
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Not protected → allow
  if (!isProtectedPath(pathname)) return NextResponse.next();

  // If session cookie exists and is not empty → allow
  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  if (sessionId && sessionId.trim().length > 0) return NextResponse.next();

  // API routes: return 401 JSON (no redirects)
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  }

  // UI routes: redirect to login with next
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname + search);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/apply/:path*",
    "/scholarships/apply/:path*",
    "/admin/:path*",
    "/api/applications/:path*",
  ],
};
