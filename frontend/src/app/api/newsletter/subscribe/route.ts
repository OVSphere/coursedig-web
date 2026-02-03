import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ message: "Enter a valid email." }, { status: 400 });
    }

    const id = crypto.randomUUID();

    try {
      await db.query(
        "insert into newsletter_subscribers (id, email) values ($1, $2)",
        [id, email]
      );
      return NextResponse.json({ status: "subscribed" }, { status: 200 });
    } catch (e: any) {
      // unique constraint violation (already subscribed)
      return NextResponse.json({ status: "already_subscribed" }, { status: 200 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: "Subscribe failed." }, { status: 500 });
  }
}
