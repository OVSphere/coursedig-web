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

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    let files: FileMeta[] = [];
    if (Array.isArray(body.files)) {
      files = body.files.map((f: any) => ({
        fileName: String(f.fileName ?? f.name ?? ""),
        mimeType: String(f.mimeType ?? f.type ?? ""),
        sizeBytes: asNumber(f.sizeBytes ?? f.size ?? 0),
      }));
    }

    if (!files.length) {
      return NextResponse.json({ message: "No files provided." }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ message: `Maximum ${MAX_FILES} files allowed.` }, { status: 400 });
    }

    let totalBytes = 0;

    for (const f of files) {
      const fileName = f.fileName.trim();
      const mimeType = f.mimeType.trim();
      const sizeBytes = f.sizeBytes;

      if (!fileName || !mimeType || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
        return NextResponse.json({ message: "Invalid file metadata." }, { status: 400 });
      }

      if (!ALLOWED.has(mimeType)) {
        return NextResponse.json({ message: "Only PDF and image files are allowed." }, { status: 400 });
      }

      if (sizeBytes > MAX_PER_FILE_BYTES) {
        return NextResponse.json(
          { message: `Each file must be <= ${MAX_PER_FILE_MB}MB.` },
          { status: 400 }
        );
      }

      totalBytes += sizeBytes;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json(
          { message: `Total upload must be <= ${MAX_TOTAL_MB}MB.` },
          { status: 400 }
        );
      }
    }

    const bucket = process.env.S3_BUCKET_NAME;
    if (!bucket) return NextResponse.json({ message: "S3_BUCKET_NAME is not set." }, { status: 500 });

    const prefix = (process.env.S3_UPLOAD_PREFIX || "applications").replace(/\/+$/, "");

    const uploads = await Promise.all(
      files.map(async (f) => {
        const safeName = sanitizeFileName(f.fileName);
        const id = crypto.randomUUID();
        const key = `${prefix}/${user.id}/${Date.now()}-${id}-${safeName}`;

        const cmd = new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          ContentType: f.mimeType,
          ContentDisposition: `attachment; filename="${safeName}"`,
        });

        const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 10 });

        return {
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
          key,
          url,
          // backward-compatible
          s3Key: key,
          uploadUrl: url,
        };
      })
    );

    return NextResponse.json({ uploads }, { status: 200 });
  } catch (err) {
    console.error("PRESIGN_ERROR:", err);
    return NextResponse.json({ message: "Failed to create upload URLs." }, { status: 500 });
  }
}
