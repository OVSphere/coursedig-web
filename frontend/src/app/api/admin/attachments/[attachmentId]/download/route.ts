// frontend/src/app/api/admin/attachments/[attachmentId]/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { s3 } from "@/lib/s3";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const dynamic = "force-dynamic";

function jsonErr(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ attachmentId: string }> }
) {
  const gate = await requireAdminApi();
  if (!gate.ok) return jsonErr("Not authorised.", gate.status);

  const { attachmentId } = await params;
  const id = String(attachmentId || "").trim();
  if (!id) return jsonErr("Missing attachment id.", 400);

  const row = await prisma.applicationAttachment.findUnique({
    where: { id },
    select: {
      id: true,
      fileName: true,
      mimeType: true,
      s3Key: true,
    },
  });

  if (!row) return jsonErr("Attachment not found.", 404);
  if (!row.s3Key) return jsonErr("Attachment is missing s3Key.", 409);

  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) return jsonErr("S3_BUCKET_NAME is not set.", 500);

  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: row.s3Key,
    ResponseContentType: row.mimeType || undefined,
    ResponseContentDisposition: `attachment; filename="${row.fileName || "download"}"`,
  });

  const signed = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 }); // 5 mins
  return NextResponse.redirect(signed, 302);
}
