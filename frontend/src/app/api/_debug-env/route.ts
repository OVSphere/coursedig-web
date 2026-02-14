import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    has_DATABASE_URL: !!process.env.DATABASE_URL,
    has_DATABASE_DIRECT_URL: !!process.env.DATABASE_DIRECT_URL,
    nodeEnv: process.env.NODE_ENV ?? null,
  });
}
