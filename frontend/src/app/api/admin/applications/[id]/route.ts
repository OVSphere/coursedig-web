// frontend/src/app/api/admin/applications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function jsonErr(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdminApi();
  if (!gate.ok) return jsonErr("Not authorised.", gate.status);

  const { id } = await params;
  const appId = String(id || "").trim();
  if (!appId) return jsonErr("Missing application id.", 400);

  const app = await prisma.application.findUnique({
    where: { id: appId },
    select: {
      id: true,
      applicationType: true,
      appRef: true,
      createdAt: true,
      status: true,

      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dob: true,
      countryOfResidence: true,
      courseName: true,
      otherCourseName: true,
      personalStatement: true,
      courseId: true,

      attachments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          createdAt: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          s3Key: true,
          s3Url: true,
        },
      },
    },
  });

  if (!app) return jsonErr("Application not found.", 404);

  return NextResponse.json({ application: app }, { status: 200 });
}
