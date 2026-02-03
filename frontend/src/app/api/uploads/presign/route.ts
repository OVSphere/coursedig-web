import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { s3 } from "@/lib/s3";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function ymdParts(date = new Date()) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const ymd = `${yyyy}${mm}${dd}`;
  return { yyyy, mm, dd, ymd };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fileName = String(body.fileName ?? "").trim();
    const mimeType = String(body.mimeType ?? "").trim();
    const sizeBytes = Number(body.sizeBytes ?? 0);
    const appRef = String(body.appRef ?? "").trim(); // we include appRef in path

    if (!fileName || !mimeType || !appRef || !Number.isFinite(sizeBytes)) {
      return NextResponse.json({ message: "Invalid request" }, { status: 400 });
    }

    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json(
        { message: "Only PDF and image files are allowed." },
        { status: 400 }
      );
    }

    // Hard limit per file (optional safety). Total limit is enforced on submit.
    const MAX_PER_FILE = 20 * 1024 * 1024; // 20MB
    if (sizeBytes <= 0 || sizeBytes > MAX_PER_FILE) {
      return NextResponse.json(
        { message: "File too large (max 20MB per file)." },
        { status: 400 }
      );
    }

    const bucket = process.env.S3_BUCKET_NAME!;
    const { yyyy, mm, dd } = ymdParts();

    const safeName = fileName.replace(/[^\w.\-() ]/g, "_");
    const rand = crypto.randomBytes(8).toString("hex");

    // Date-based folder structure (your choice B)
    const s3Key = `applications/${yyyy}/${mm}/${dd}/${appRef}/${rand}-${safeName}`;

    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      ContentType: mimeType,
      // Optional: store metadata
      Metadata: {
        appref: appRef,
        originalname: safeName,
      },
    });

    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 }); // 5 mins

    return NextResponse.json(
      {
        uploadUrl,
        s3Key,
        bucket,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Presign failed" }, { status: 500 });
  }
}
