// frontend/src/app/api/applications/my/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function jsonErr(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonErr("Not authenticated.", 401);

    const id = String(ctx?.params?.id || "").trim();
    if (!id) return jsonErr("Missing application id.", 400);

    const app = await prisma.application.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        appRef: true,
        applicationType: true,
        courseName: true,
        otherCourseName: true,
        createdAt: true,
        status: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        countryOfResidence: true,
        personalStatement: true,
        attachments: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            createdAt: true,
            fileName: true,
            mimeType: true,
            sizeBytes: true,
          },
        },
      },
    });

    if (!app) return jsonErr("Application not found.", 404);

    return NextResponse.json({ application: app }, { status: 200 });
  } catch (e) {
    console.error("MY_APPLICATION_DETAIL_ERROR:", e);
    return NextResponse.json({ message: "Failed to load application." }, { status: 500 });
  }
}
