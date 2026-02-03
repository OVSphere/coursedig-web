// frontend/src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("AUTH_ME_ERROR:", e);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
