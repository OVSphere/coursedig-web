import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ message: "Logged out." }, { status: 200 });
  } catch (err) {
    console.error("LOGOUT_ERROR:", err);
    return NextResponse.json({ message: "Logout failed." }, { status: 500 });
  }
}
