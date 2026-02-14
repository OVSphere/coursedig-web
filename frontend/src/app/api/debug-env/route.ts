//frontend\src\app\api\debug-env\route.ts"
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // We only return the KEYS, not the VALUES (for security)
  // This confirms if DATABASE_URL even exists in the environment.
  const envKeys = Object.keys(process.env);
  
  return NextResponse.json({
    message: "Runtime Environment Check",
    presentKeys: envKeys.filter(key => 
      key.includes("DATABASE") || 
      key.includes("AMPLIFY") || 
      key.includes("AWS")
    ),
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DATABASE_DIRECT_URL,
    nodeEnv: process.env.NODE_ENV,
  });
}