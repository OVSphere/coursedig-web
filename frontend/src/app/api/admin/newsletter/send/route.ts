//frontend/src/app/api/admin/newsletter/send/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emailConfigured, sendEmail as sendSmtpEmail } from "@/lib/mailer";

const DEV_FORCE_EMAIL = process.env.DEV_FORCE_EMAIL;

async function sendEmail(to: string, subject: string, html: string, text: string) {
  const isProd = process.env.NODE_ENV === "production";
  const finalTo = !isProd && DEV_FORCE_EMAIL ? DEV_FORCE_EMAIL : to;

  // Uses Hostgator SMTP via lib/mailer.ts
  await sendSmtpEmail({
    to: finalTo,
    subject,
    html,
    text,
  });
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

  // ✅ Hostgator SMTP configured check
  if (!emailConfigured()) {
    return NextResponse.json(
      { message: "Email service not configured (SMTP settings missing)." },
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

  // Send (sequential to avoid provider throttling surprises)
  let sent = 0;

  for (const to of recipients) {
    try {
      await sendEmail(to, subject, html, text);
      sent++;
    } catch (e: any) {
      console.error("NEWSLETTER_SEND_ERROR:", to, e?.name, e?.message || e);
    }
  }

  return NextResponse.json({ sent, requested: recipients.length }, { status: 200 });
}
