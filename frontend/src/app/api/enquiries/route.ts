import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { prisma } from "@/lib/prisma";

const AWS_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";
const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL;
const SES_ADMIN_EMAIL = process.env.SES_ADMIN_EMAIL;

if (!SES_FROM_EMAIL || !SES_ADMIN_EMAIL) {
  // Fail fast in dev if env isn't set
  console.warn("Missing SES_FROM_EMAIL or SES_ADMIN_EMAIL in environment variables.");
}

const ses = new SESClient({ region: AWS_REGION });

function monthYearParts(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  const mm = String(month).padStart(2, "0");
  return { month, year, mm };
}

// Basic email check (good enough for form validation; server-side shouldn’t be too strict)
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendEmail(params: { to: string; subject: string; html: string; text: string }) {
  if (!SES_FROM_EMAIL) throw new Error("SES_FROM_EMAIL is not set");
  const cmd = new SendEmailCommand({
    Source: SES_FROM_EMAIL,
    Destination: { ToAddresses: [params.to] },
    Message: {
      Subject: { Data: params.subject, Charset: "UTF-8" },
      Body: {
        Html: { Data: params.html, Charset: "UTF-8" },
        Text: { Data: params.text, Charset: "UTF-8" },
      },
    },
  });

  await ses.send(cmd);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const message = String(body.message ?? "").trim();

    // ✅ Better validation
    if (!fullName || !isValidEmail(email) || !message) {
      return NextResponse.json(
        { message: "Invalid input. Please check your name, email, and message." },
        { status: 400 }
      );
    }

    const { month, year, mm } = monthYearParts();

    // ✅ Transaction ensures: counter increment + enquiry create are atomic
    const enquiry = await prisma.$transaction(async (tx) => {
      const counter = await tx.enquiryCounter.upsert({
        where: { year_month: { year, month } },
        update: { lastValue: { increment: 1 } },
        create: { year, month, lastValue: 1 },
        select: { lastValue: true },
      });

      const seq = String(counter.lastValue).padStart(4, "0");
      const enquiryRef = `ENQ-${mm}-${year}-${seq}`;

      // Save enquiry
      const created = await tx.enquiry.create({
        data: {
          enquiryRef,
          fullName,
          email,
          phone: phone || null,
          message,
        },
        select: {
          enquiryRef: true,
          fullName: true,
          email: true,
          phone: true,
          message: true,
          createdAt: true,
        },
      });

      return created;
    });

    const enquiryRef = enquiry.enquiryRef;

    // ✅ Email templates
    const userSubject = `CourseDig Enquiry Received: ${enquiryRef}`;
    const adminSubject = `New CourseDig Enquiry: ${enquiryRef}`;

    const userText =
      `Thank you — your enquiry has been received.\n` +
      `Reference: ${enquiryRef}\n\n` +
      `We will respond by email as soon as possible.\n`;

    const userHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Thank you — your enquiry has been received.</h2>
        <p><strong>Your reference:</strong> ${enquiryRef}</p>
        <p>We will respond by email as soon as possible.</p>
      </div>
    `;

    const adminText =
      `New enquiry received\n\n` +
      `Ref: ${enquiryRef}\n` +
      `Name: ${enquiry.fullName}\n` +
      `Email: ${enquiry.email}\n` +
      `Phone: ${enquiry.phone || "-"}\n` +
      `Created: ${enquiry.createdAt.toISOString()}\n\n` +
      `Message:\n${enquiry.message}\n`;

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>New enquiry received</h2>
        <p><strong>Ref:</strong> ${enquiryRef}</p>
        <p>
          <strong>Name:</strong> ${enquiry.fullName}<br/>
          <strong>Email:</strong> ${enquiry.email}<br/>
          <strong>Phone:</strong> ${enquiry.phone || "-"}<br/>
          <strong>Created:</strong> ${enquiry.createdAt.toISOString()}
        </p>
        <p><strong>Message:</strong></p>
        <pre style="background:#f5f5f5;padding:12px;border-radius:6px;white-space:pre-wrap;">${enquiry.message}</pre>
      </div>
    `;

    // ✅ Send emails AFTER DB save (so ref is never lost)
    await sendEmail({ to: enquiry.email, subject: userSubject, html: userHtml, text: userText });

    if (!SES_ADMIN_EMAIL) throw new Error("SES_ADMIN_EMAIL is not set");
    await sendEmail({
      to: SES_ADMIN_EMAIL,
      subject: adminSubject,
      html: adminHtml,
      text: adminText,
    });

    return NextResponse.json(
      { enquiryRef, message: "Thanks—your enquiry has been received." },
      { status: 200 }
    );
  } catch (err: any) {
    // ✅ Better logging (don’t leak internals to users)
    console.error("ENQUIRY_API_ERROR:", err?.name, err?.message);

    return NextResponse.json(
      { message: "Something went wrong sending your enquiry. Please try again shortly." },
      { status: 500 }
    );
  }
}
