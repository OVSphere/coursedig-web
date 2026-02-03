import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { prisma } from "@/lib/prisma";

const AWS_REGION =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";

const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL;
const SES_ADMIN_EMAIL = process.env.SES_ADMIN_EMAIL;

const ses = new SESClient({ region: AWS_REGION });

function currentYear(date = new Date()) {
  return date.getFullYear();
}

// Basic email check (good enough for server validation)
function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
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

    if (!fullName || !isValidEmail(email) || !message) {
      return NextResponse.json(
        { message: "Invalid input. Please check your name, email, and message." },
        { status: 400 }
      );
    }

    const year = currentYear();

    // ✅ ENQ-YYYY-XXXXXX (6-digit sequence)
    // We reuse your existing EnquiryCounter model (year+month) by fixing month=0 for yearly counters.
    const enquiry = await prisma.$transaction(async (tx) => {
      const counter = await tx.enquiryCounter.upsert({
        where: { year_month: { year, month: 0 } },
        update: { lastValue: { increment: 1 } },
        create: { year, month: 0, lastValue: 1 },
        select: { lastValue: true },
      });

      const seq = String(counter.lastValue).padStart(6, "0");
      const enquiryRef = `ENQ-${year}-${seq}`;

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

    // Email templates
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

    // ✅ In dev, if SES env isn’t set, don’t fail the enquiry.
    const isProd = process.env.NODE_ENV === "production";
    const canSend = Boolean(SES_FROM_EMAIL && SES_ADMIN_EMAIL);

    if (canSend) {
      await sendEmail({
        to: enquiry.email,
        subject: userSubject,
        html: userHtml,
        text: userText,
      });

      await sendEmail({
        to: SES_ADMIN_EMAIL as string,
        subject: adminSubject,
        html: adminHtml,
        text: adminText,
      });
    } else {
      const msg = "SES_FROM_EMAIL / SES_ADMIN_EMAIL not set; skipping email send.";
      if (isProd) {
        // In production you may prefer failing. If you want “save anyway”, tell me.
        console.error(msg);
      } else {
        console.warn(msg);
      }
    }

    return NextResponse.json(
      { enquiryRef, message: "Thanks—your enquiry has been received." },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("ENQUIRY_API_ERROR:", err?.name, err?.message);

    return NextResponse.json(
      { message: "Something went wrong sending your enquiry. Please try again shortly." },
      { status: 500 }
    );
  }
}
