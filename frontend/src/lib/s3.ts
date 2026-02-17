// frontend/src/lib/s3.ts
import { S3Client } from "@aws-sdk/client-s3";

const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";

// ✅ IMPORTANT: explicitly set checksum behaviour to avoid presigned URL checksum params
export const s3 = new S3Client({
  region,

  // These are safe in Amplify SSR if env vars exist at runtime (.env.production build pattern)
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined,

  // ✅ Key fix
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});
