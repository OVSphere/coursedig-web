//frontend\src\app\api\debug-env\route.ts"
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  // Extracting keys to verify existence without leaking sensitive values
  const envKeys = Object.keys(process.env);
  
  const report = {
    timestamp: new Date().toISOString(),
    status: "Runtime Check",
    // Check for the specific keys Prisma needs
    databaseUrlFound: !!process.env.DATABASE_URL,
    directUrlFound: !!process.env.DATABASE_DIRECT_URL,
    // List all related keys to see if Amplify renamed them
    detectedKeys: envKeys.filter(key => 
      key.includes("DATABASE") || 
      key.includes("PRISMA") || 
      key.includes("AMPLIFY")
    ),
    nodeEnv: process.env.NODE_ENV,
    // Helps identify if we are in the Amplify build machine or the actual Lambda
    isAmplifyRuntime: !!process.env.AWS_LAMBDA_FUNCTION_NAME
  };

  return NextResponse.json(report);
}