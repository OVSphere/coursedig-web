// frontend/src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE =
  process.env.SESSION_COOKIE_NAME || "coursedig_session";

function isProtectedPath(pathname: string) {
  return (
    pathname.startsWith("/apply") ||
    pathname.startsWith("/scholarships/apply") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/applications")
  );
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (!isProtectedPath(pathname)) return NextResponse.next();

  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;
  if (sessionId) return NextResponse.next();

  // If API, return JSON 401 (don’t redirect)
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
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
