// frontend/src/app/api/enquiries/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailConfigured, getRoleFromEmail, sendEmail } from "@/lib/mailer";

function currentYear(date = new Date()) {
  return date.getFullYear();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function safeLine(v: string) {
  return String(v || "").replace(/\s+/g, " ").trim().slice(0, 180);
}

function buildStructuredMessage(params: {
  enquiryType: string;
  bestContactMethod?: string;
  courseInterestedIn?: string;
  preferredStartDate?: string;
  studyMode?: string;
  scholarshipType?: string;
  applicationRef?: string;
  paymentRef?: string;
  userMessage: string;
}) {
  const lines: string[] = [];
  lines.push(`[TYPE] ${safeLine(params.enquiryType || "GENERAL")}`);
  if (params.bestContactMethod)
    lines.push(`[CONTACT_METHOD] ${safeLine(params.bestContactMethod)}`);
  if (params.courseInterestedIn)
    lines.push(`[COURSE] ${safeLine(params.courseInterestedIn)}`);
  if (params.preferredStartDate)
    lines.push(`[START_DATE] ${safeLine(params.preferredStartDate)}`);
  if (params.studyMode) lines.push(`[STUDY_MODE] ${safeLine(params.studyMode)}`);
  if (params.scholarshipType)
    lines.push(`[SCHOLARSHIP] ${safeLine(params.scholarshipType)}`);
  if (params.applicationRef)
    lines.push(`[APPLICATION_REF] ${safeLine(params.applicationRef)}`);
  if (params.paymentRef)
    lines.push(`[PAYMENT_REF] ${safeLine(params.paymentRef)}`);

  lines.push("");
  lines.push(params.userMessage || "");

  return lines.join("\n");
}

function getClientIp(req: Request) {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;

  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim();

  return undefined;
}

/* =========================================================
   VALIDATION RULES (CourseDig)
   - Message min 200 chars / max 2000 chars
   - Full name required (no word-count rule)
   - Email required + valid format
   ========================================================= */
const MIN_MESSAGE_CHARS = 200;
const MAX_MESSAGE_CHARS = 2000;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const enquiryType = String(body.enquiryType ?? "GENERAL")
      .trim()
      .toUpperCase();

    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const userMessage = String(body.message ?? "").trim();

    const courseInterestedIn = String(body.courseInterestedIn ?? "").trim();
    const preferredStartDate = String(body.preferredStartDate ?? "").trim();
    const studyMode = String(body.studyMode ?? "").trim();
    const scholarshipType = String(body.scholarshipType ?? "").trim();
    const applicationRef = String(body.applicationRef ?? "").trim();
    const paymentRef = String(body.paymentRef ?? "").trim();
    const bestContactMethod = String(body.bestContactMethod ?? "").trim();

    const hp = String(body.hp ?? "").trim();
    if (hp) {
      return NextResponse.json({ message: "Request blocked." }, { status: 400 });
    }

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { message: "Please enter your full name." },
        { status: 400 }
      );
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address (e.g. you@example.com)." },
        { status: 400 }
      );
    }

    if (userMessage.length < MIN_MESSAGE_CHARS) {
      return NextResponse.json(
        {
          message: `Your message is too short. Please enter at least ${MIN_MESSAGE_CHARS} characters.`,
        },
        { status: 400 }
      );
    }

    if (userMessage.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        {
          message: `Your message is too long. Maximum allowed length is ${MAX_MESSAGE_CHARS} characters.`,
        },
        { status: 400 }
      );
    }

    if (enquiryType === "APPLICATION_PROGRESS" && applicationRef.length < 6) {
      return NextResponse.json(
        {
          message:
            "Please provide your application reference to help us locate your record.",
        },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);

    const message = buildStructuredMessage({
      enquiryType,
      bestContactMethod,
      courseInterestedIn,
      preferredStartDate,
      studyMode,
      scholarshipType,
      applicationRef,
      paymentRef,
      userMessage,
    });

    const year = currentYear();

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
    `.trim();

    const adminText =
      `New enquiry received\n\n` +
      `Ref: ${enquiryRef}\n` +
      `Type: ${enquiryType}\n` +
      `Name: ${enquiry.fullName}\n` +
      `Email: ${enquiry.email}\n` +
      `Phone: ${enquiry.phone || "-"}\n` +
      `IP: ${ip || "-"}\n` +
      `Created: ${enquiry.createdAt.toISOString()}\n\n` +
      `Message:\n${enquiry.message}\n`;

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>New enquiry received</h2>
        <p><strong>Ref:</strong> ${enquiryRef}</p>
        <p><strong>Type:</strong> ${enquiryType}</p>
        <p>
          <strong>Name:</strong> ${enquiry.fullName}<br/>
          <strong>Email:</strong> ${enquiry.email}<br/>
          <strong>Phone:</strong> ${enquiry.phone || "-"}<br/>
          <strong>IP:</strong> ${ip || "-"}<br/>
          <strong>Created:</strong> ${enquiry.createdAt.toISOString()}
        </p>
        <p><strong>Message:</strong></p>
        <pre style="background:#f5f5f5;padding:12px;border-radius:6px;white-space:pre-wrap;">${enquiry.message}</pre>
      </div>
    `.trim();

    /**
     * Admin inbox:
     * - Keep compatibility: SES_ADMIN_EMAIL (existing)
     * - Allow new naming: CONTACT_ADMIN_EMAIL
     * - If neither set, we skip admin notification safely.
     */
    const adminTo =
      (process.env.CONTACT_ADMIN_EMAIL || process.env.SES_ADMIN_EMAIL || "").trim();

    const canSend = emailConfigured();

    if (!canSend) {
      console.warn("ENQUIRY_EMAIL_NOT_CONFIGURED: skipping email send");
    } else {
      const fromContact = getRoleFromEmail("contact") || undefined;

      // User confirmation (from contact@)
      try {
        await sendEmail({
          to: enquiry.email,
          subject: userSubject,
          html: userHtml,
          text: userText,
          from: fromContact,
          replyTo: fromContact, // if user replies, it goes to contact@
        });
      } catch (e: any) {
        console.error("ENQUIRY_USER_EMAIL_SEND_FAILED:", e?.name, e?.message || e);
      }

      // Admin notification (reply-to set to user so admin can reply directly)
      if (adminTo) {
        try {
          await sendEmail({
            to: adminTo,
            subject: adminSubject,
            html: adminHtml,
            text: adminText,
            from: fromContact,
            replyTo: enquiry.email,
          });
        } catch (e: any) {
          console.error("ENQUIRY_ADMIN_EMAIL_SEND_FAILED:", e?.name, e?.message || e);
        }
      } else {
        console.warn("ENQUIRY_ADMIN_EMAIL_NOT_SET: skipping admin notification");
      }
    }

    return NextResponse.json(
      { enquiryRef, message: "Thanks—your enquiry has been received." },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("ENQUIRY_API_ERROR:", err?.name, err?.message || err);

    return NextResponse.json(
      {
        message:
          "Something went wrong sending your enquiry. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
