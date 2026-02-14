import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mask(v?: string | null) {
  if (!v) return null;
  if (v.length <= 12) return "********";
  return v.slice(0, 6) + "..." + v.slice(-4);
}

export async function GET() {
  const dUrl = process.env.DATABASE_URL ?? null;
  const ddUrl = process.env.DATABASE_DIRECT_URL ?? null;

  return NextResponse.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV ?? null,
    has_DATABASE_URL: !!dUrl,
    has_DATABASE_DIRECT_URL: !!ddUrl,
    DATABASE_URL_masked: mask(dUrl),
    DATABASE_DIRECT_URL_masked: mask(ddUrl),

    // helps confirm you’re in Amplify compute at runtime
    amplify: {
      AWS_REGION: process.env.AWS_REGION ?? null,
      AWS_EXECUTION_ENV: process.env.AWS_EXECUTION_ENV ?? null,
    },
  });
}
