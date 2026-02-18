// frontend/src/middleware.ts
import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME || "coursedig_session";

function normalisePath(pathname: string) {
  return pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
}

function isProtectedPath(pathname: string) {
  const p = normalisePath(pathname);

  return (
    p === "/apply" ||
    p.startsWith("/apply/") ||
    p === "/scholarships/apply" ||
    p.startsWith("/scholarships/apply/") ||
    p === "/admin" ||
    p.startsWith("/admin/") ||
    p === "/profile" ||
    p.startsWith("/profile/") ||
    p === "/api/applications" ||
    p.startsWith("/api/applications/") ||
    p === "/api/admin" ||
    p.startsWith("/api/admin/")
  );
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const sessionId = req.cookies.get(SESSION_COOKIE)?.value;

  if (!sessionId || sessionId.trim().length === 0) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }

    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";

    // ✅ Preserve the full requested path, including query string
    const requested = `${pathname}${search || ""}`;
    loginUrl.searchParams.set("next", requested);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/apply/:path*",
    "/scholarships/apply/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/api/applications/:path*",
    "/api/admin/:path*",
  ],
};
