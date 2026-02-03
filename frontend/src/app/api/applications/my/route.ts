// frontend/src/app/api/applications/my/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
    }

    const items = await prisma.application.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        appRef: true,
        courseName: true,
        createdAt: true,
        status: true, // remove if you don't have this field
      },
    });

    return NextResponse.json({ applications: items }, { status: 200 });
  } catch (e) {
    console.error("MY_APPLICATIONS_ERROR:", e);
    return NextResponse.json({ message: "Failed to load applications." }, { status: 500 });
  }
}
