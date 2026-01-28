import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const adminKey = process.env.ADMIN_KEY;
  const url = req.nextUrl;

  if (url.pathname.startsWith("/admin")) {
    const key = url.searchParams.get("key");
    if (!adminKey || key !== adminKey) {
      return NextResponse.json({ message: "Unauthorised" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
