// frontend/src/app/api/health/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mask(v?: string | null) {
  if (!v) return null;
  if (v.length <= 12) return "********";
  return v.slice(0, 6) + "..." + v.slice(-4);
}

function readSecretsJson(): any | null {
  const raw = process.env.secrets;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function GET() {
  const envUrl = process.env.DATABASE_URL ?? null;
  const envDirect = process.env.DATABASE_DIRECT_URL ?? null;

  const secrets = readSecretsJson();
  const secUrl = (secrets?.DATABASE_URL as string | undefined) ?? null;
  const secDirect = (secrets?.DATABASE_DIRECT_URL as string | undefined) ?? null;

  const effectiveUrl = envDirect || envUrl || secDirect || secUrl || null;

  return NextResponse.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV ?? null,

    // env vars
    has_DATABASE_URL_env: !!envUrl,
    has_DATABASE_DIRECT_URL_env: !!envDirect,

    // secrets blob (if present)
    has_process_env_secrets: !!process.env.secrets,
    has_DATABASE_URL_secret: !!secUrl,
    has_DATABASE_DIRECT_URL_secret: !!secDirect,

    // final decision
    has_EFFECTIVE_DB: !!effectiveUrl,

    DATABASE_URL_env_masked: mask(envUrl),
    DATABASE_DIRECT_URL_env_masked: mask(envDirect),
    DATABASE_URL_secret_masked: mask(secUrl),
    DATABASE_DIRECT_URL_secret_masked: mask(secDirect),

    // helps confirm you’re in Amplify compute at runtime
    amplify: {
      AWS_REGION: process.env.AWS_REGION ?? null,
      AWS_EXECUTION_ENV: process.env.AWS_EXECUTION_ENV ?? null,
    },
  });
}
