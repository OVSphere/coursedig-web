// frontend/src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

function getNext(req: Request) {
  try {
    const url = new URL(req.url);
    const next = url.searchParams.get("next") || "/";
    // Safety: only allow internal redirects
    if (!next.startsWith("/")) return "/";
    return next;
  } catch {
    return "/";
  }
}

// ✅ Allow GET so <Link href="/api/auth/logout"> works
export async function GET(req: Request) {
  try {
    await destroySession();
    const next = getNext(req);

    // Use req.url as base so it works in dev/prod
    return NextResponse.redirect(new URL(next, req.url));
  } catch (err) {
    console.error("LOGOUT_ERROR:", err);
    return NextResponse.redirect(new URL("/", req.url));
  }
}

// ✅ Keep POST for programmatic logout (fetch)
export async function POST(req: Request) {
  try {
    await destroySession();
    const next = getNext(req);
    return NextResponse.json({ ok: true, next }, { status: 200 });
  } catch (err) {
    console.error("LOGOUT_ERROR:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
