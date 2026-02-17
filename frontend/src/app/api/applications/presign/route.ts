// frontend/src/app/api/applications/presign/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { s3 } from "@/lib/s3";
import { PutObjectCommand, type PutObjectCommandInput } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { UPLOAD_LIMITS, UPLOAD_LIMIT_BYTES } from "@/lib/uploadLimits";

const ALLOWED = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MAX_FILES = UPLOAD_LIMITS.MAX_FILES;
const MAX_TOTAL_MB = UPLOAD_LIMITS.MAX_TOTAL_MB;
const MAX_PER_FILE_MB = UPLOAD_LIMITS.MAX_PER_FILE_MB;

const MAX_TOTAL_BYTES = UPLOAD_LIMIT_BYTES.MAX_TOTAL_BYTES;
const MAX_PER_FILE_BYTES = UPLOAD_LIMIT_BYTES.MAX_PER_FILE_BYTES;

type FileMeta = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

function asNumber(v: unknown) {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? n : NaN;
}

function sanitizeFileName(name: string) {
  return String(name || "")
    .replace(/[^\w.\-() ]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ message, ...(extra ?? {}) }, { status });
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Unauthorised", 401);

    const body = await req.json().catch(() => ({}));

    let files: FileMeta[] = [];
    if (Array.isArray(body.files)) {
      files = body.files.map((f: any) => ({
        fileName: String(f.fileName ?? f.name ?? "").trim(),
        mimeType: String(f.mimeType ?? f.type ?? "").trim(),
        sizeBytes: asNumber(f.sizeBytes ?? f.size ?? 0),
      }));
    }

    if (!files.length) return jsonError("No files provided.", 400);
    if (files.length > MAX_FILES) {
      return jsonError(`Maximum ${MAX_FILES} files allowed.`, 400);
    }

    let totalBytes = 0;

    for (const f of files) {
      if (!f.fileName || !f.mimeType || !Number.isFinite(f.sizeBytes) || f.sizeBytes <= 0) {
        return jsonError("Invalid file metadata.", 400);
      }

      if (!ALLOWED.has(f.mimeType)) {
        return jsonError("Only PDF and image files are allowed.", 400);
      }

      if (f.sizeBytes > MAX_PER_FILE_BYTES) {
        return jsonError(`Each file must be <= ${MAX_PER_FILE_MB}MB.`, 400);
      }

      totalBytes += f.sizeBytes;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return jsonError(`Total upload must be <= ${MAX_TOTAL_MB}MB.`, 400);
      }
    }

    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) return jsonError("S3_BUCKET_NAME is not set.", 500);

    const prefix = (process.env.S3_UPLOAD_PREFIX || "applications").replace(/\/+$/, "");

    // Optional: allow local dev without AWS by bypassing presign
    const bypass = String(process.env.BYPASS_S3_PRESIGN ?? "").toLowerCase() === "true";
    if (bypass) {
      const uploads = files.map((f) => {
        const safeName = sanitizeFileName(f.fileName);
        const id = crypto.randomUUID();
        const key = `${prefix}/${user.id}/${Date.now()}-${id}-${safeName}`;

        return {
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
          key,
          url: "BYPASS",
          s3Key: key,
          uploadUrl: "BYPASS",
        };
      });

      return NextResponse.json({ uploads, bypass: true }, { status: 200 });
    }

    /**
     * IMPORTANT:
     * Keep PutObjectCommand minimal for browser PUT uploads.
     * Do NOT set:
     * - ACL
     * - ContentDisposition
     * - ChecksumAlgorithm
     */
    const uploads = await Promise.all(
      files.map(async (f) => {
        const safeName = sanitizeFileName(f.fileName);
        const id = crypto.randomUUID();
        const key = `${prefix}/${user.id}/${Date.now()}-${id}-${safeName}`;

        const input: PutObjectCommandInput = {
          Bucket: bucket,
          Key: key,
          ContentType: f.mimeType,
        };

        const cmd = new PutObjectCommand(input);

        // short-lived presign (5 mins)
        const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });

        return {
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
          key,
          url,
          s3Key: key, // backward-compatible
          uploadUrl: url, // backward-compatible
        };
      })
    );

    return NextResponse.json({ uploads }, { status: 200 });
  } catch (err) {
    console.error("PRESIGN_ERROR:", err);
    return NextResponse.json({ message: "Failed to create upload URLs." }, { status: 500 });
  }
}
