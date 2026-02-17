// frontend/src/lib/s3.ts
import { S3Client } from "@aws-sdk/client-s3";

const region =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";

/**
 * CourseDig S3 client
 * - In Amplify/production: prefer IAM role credentials (recommended)
 * - If env static keys exist, SDK can use them (optional)
 *
 * NOTE:
 * Do NOT try to set requestChecksumCalculation="NEVER" — it is not valid in
 * the AWS SDK types you currently have installed and will break builds.
 */
export const s3 = new S3Client({
  region,

  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        }
      : undefined,
});
