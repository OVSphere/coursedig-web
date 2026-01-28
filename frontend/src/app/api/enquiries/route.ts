import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

function generateEnquiryRef() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  const temp = String(Math.floor(1000 + Math.random() * 9000));
  return `ENQ-${mm}-${yyyy}-${temp}`;
}

const ses = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function sendEmail(to: string, subject: string, bodyText: string) {
  const from = process.env.SES_FROM_EMAIL;
  if (!from) throw new Error("Missing SES_FROM_EMAIL");

  const cmd = new SendEmailCommand({
    Source: from,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: {
        Text: { Data: bodyText, Charset: "UTF-8" },
      },
    },
  });

  await ses.send(cmd);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fullName, email, phone, message } = body || {};

    if (!fullName || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const enquiryRef = generateEnquiryRef();

    // 1) Email to enquirer
    const userSubject = `CourseDig Enquiry Received: ${enquiryRef}`;
    const userBody =
      `Hello ${fullName},\n\n` +
      `Thank you - your enquiry has been received.\n` +
      `Reference: ${enquiryRef}\n\n` +
      `We will respond by email as soon as possible.\n\n` +
      `CourseDig Admissions`;

    // 2) Email to admin/admissions
    const adminTo = process.env.SES_ADMIN_EMAIL;
    if (!adminTo) throw new Error("Missing SES_ADMIN_EMAIL");

    const adminSubject = `New CourseDig Enquiry: ${enquiryRef}`;
    const adminBody =
      `New enquiry received.\n\n` +
      `Reference: ${enquiryRef}\n` +
      `Full name: ${fullName}\n` +
      `Email: ${email}\n` +
      `Phone: ${phone || "-"}\n\n` +
      `Message:\n${message}\n`;

    // Send both (sequential for simplicity)
    await sendEmail(email, userSubject, userBody);
    await sendEmail(adminTo, adminSubject, adminBody);

    return NextResponse.json({
      enquiryRef,
      message: "Thanks - your enquiry has been received.",
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Email failed. Check SES verification/sandbox and credentials." },
      { status: 500 }
    );
  }
}
