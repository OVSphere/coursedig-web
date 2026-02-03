// src/app/api/applications/presign/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { s3 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
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

    // Important: if UI calls presign with empty list, return a clear 400 (not 500)
    if (!files.length) {
      return jsonError("No files provided.", 400);
    }

    if (files.length > MAX_FILES) {
      return jsonError(`Maximum ${MAX_FILES} files allowed.`, 400);
    }

    let totalBytes = 0;

    for (const f of files) {
      const fileName = f.fileName;
      const mimeType = f.mimeType;
      const sizeBytes = f.sizeBytes;

      if (!fileName || !mimeType || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
        return jsonError("Invalid file metadata.", 400);
      }

      if (!ALLOWED.has(mimeType)) {
        return jsonError("Only PDF and image files are allowed.", 400);
      }

      if (sizeBytes > MAX_PER_FILE_BYTES) {
        return jsonError(`Each file must be <= ${MAX_PER_FILE_MB}MB.`, 400);
      }

      totalBytes += sizeBytes;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return jsonError(`Total upload must be <= ${MAX_TOTAL_MB}MB.`, 400);
      }
    }

    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) return jsonError("S3_BUCKET_NAME is not set.", 500);

    const prefix = (process.env.S3_UPLOAD_PREFIX || "applications").replace(/\/+$/, "");

    // Optional: allow local dev without AWS by bypassing presign (keeps UI moving)
    // Set BYPASS_S3_PRESIGN=true in .env.local if you want to skip S3 locally.
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
          // backward-compatible
          s3Key: key,
          uploadUrl: "BYPASS",
        };
      });

      return NextResponse.json({ uploads, bypass: true }, { status: 200 });
    }

    const uploads = await Promise.all(
      files.map(async (f) => {
        const safeName = sanitizeFileName(f.fileName);
        const id = crypto.randomUUID();
        const key = `${prefix}/${user.id}/${Date.now()}-${id}-${safeName}`;

        const cmd = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: f.mimeType,
          // helps downloads keep the original filename
          ContentDisposition: `attachment; filename="${safeName}"`,
        });

        const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 10 }); // 10 mins

        return {
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
          key,
          url,
          // backward-compatible (some older client code expects these)
          s3Key: key,
          uploadUrl: url,
        };
      })
    );

    return NextResponse.json({ uploads }, { status: 200 });
  } catch (err) {
    console.error("PRESIGN_ERROR:", err);
    return NextResponse.json(
      { message: "Failed to create upload URLs." },
      { status: 500 }
    );
  }
}
