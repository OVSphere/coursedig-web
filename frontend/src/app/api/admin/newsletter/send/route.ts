import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const AWS_REGION =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";

const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL;
const DEV_FORCE_EMAIL = process.env.DEV_FORCE_EMAIL;

const ses = new SESClient({ region: AWS_REGION });

async function sendEmail(to: string, subject: string, html: string, text: string) {
  if (!SES_FROM_EMAIL) throw new Error("SES_FROM_EMAIL is not set");
  const isProd = process.env.NODE_ENV === "production";
  const finalTo = !isProd && DEV_FORCE_EMAIL ? DEV_FORCE_EMAIL : to;

  const cmd = new SendEmailCommand({
    Source: SES_FROM_EMAIL,
    Destination: { ToAddresses: [finalTo] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: html, Charset: "UTF-8" },
        Text: { Data: text, Charset: "UTF-8" },
      },
    },
  });

  await ses.send(cmd);
}

type Body = {
  mode: "ALL_ACTIVE" | "SELECTED" | "INDIVIDUAL";
  ids?: string[];
  email?: string; // for INDIVIDUAL
  subject: string;
  html: string;
  text?: string;
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

  // Admin or Super Admin can send
  if (!user.isAdmin && !user.isSuperAdmin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (!SES_FROM_EMAIL) {
    return NextResponse.json(
      { message: "Email service not configured (SES_FROM_EMAIL missing)." },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => ({}))) as Body;

  const mode = body.mode;
  const subject = String(body.subject ?? "").trim();
  const html = String(body.html ?? "").trim();
  const text = String(body.text ?? "").trim() || " ";

  if (!subject || subject.length < 3) {
    return NextResponse.json({ message: "Subject is required." }, { status: 400 });
  }
  if (!html || html.length < 10) {
    return NextResponse.json({ message: "HTML content is required." }, { status: 400 });
  }

  let recipients: string[] = [];

  if (mode === "ALL_ACTIVE") {
    const rows = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true },
      take: 5000,
    });
    recipients = rows.map((r) => r.email);
  } else if (mode === "SELECTED") {
    const ids = Array.isArray(body.ids) ? body.ids.map(String).filter(Boolean) : [];
    if (!ids.length) {
      return NextResponse.json({ message: "No subscribers selected." }, { status: 400 });
    }
    const rows = await prisma.newsletterSubscriber.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { email: true },
    });
    recipients = rows.map((r) => r.email);
  } else if (mode === "INDIVIDUAL") {
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Enter a valid recipient email." }, { status: 400 });
    }
    recipients = [email];
  } else {
    return NextResponse.json({ message: "Invalid mode." }, { status: 400 });
  }

  if (!recipients.length) {
    return NextResponse.json({ message: "No recipients found." }, { status: 400 });
  }

  // Send (sequential to avoid SES throttling surprises)
  let sent = 0;
  for (const to of recipients) {
    try {
      await sendEmail(to, subject, html, text);
      sent++;
    } catch (e) {
      // continue; we return counts
      console.error("NEWSLETTER_SEND_ERROR:", to, e);
    }
  }

  return NextResponse.json({ sent, requested: recipients.length }, { status: 200 });
}
