// frontend/src/app/api/enquiries/route.ts
import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { prisma } from "@/lib/prisma";

const AWS_REGION =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";

const SES_FROM_EMAIL = process.env.SES_FROM_EMAIL;
const SES_ADMIN_EMAIL = process.env.SES_ADMIN_EMAIL;

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || "";

const ses = new SESClient({ region: AWS_REGION });

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
  if (params.paymentRef) lines.push(`[PAYMENT_REF] ${safeLine(params.paymentRef)}`);

  lines.push(""); // spacer
  lines.push(params.userMessage || "");

  return lines.join("\n");
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

async function verifyTurnstile(token: string, ip?: string) {
  // If not configured, skip in dev; enforce in production
  const isProd = process.env.NODE_ENV === "production";

  if (!TURNSTILE_SECRET_KEY) {
    return {
      ok: !isProd,
      reason: isProd ? "Turnstile not configured" : "Skipped (dev)",
    };
  }

  if (!token) return { ok: false, reason: "Missing security token" };

  const form = new URLSearchParams();
  form.set("secret", TURNSTILE_SECRET_KEY);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);

  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const data: any = await r.json().catch(() => ({}));

  if (!data?.success) {
    return { ok: false, reason: "Security check failed" };
  }

  return { ok: true as const };
}

function getClientIp(req: Request) {
  // Cloudflare → cf-connecting-ip
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;

  // Proxies → x-forwarded-for (first IP)
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim();

  return undefined;
}

/* =========================================================
   ✅ NEW VALIDATION RULES (CourseDig)
   - Message min 200 chars / max 2000 chars
   - Full name min 5 words
   - Email required + valid format
   ========================================================= */
const MIN_MESSAGE_CHARS = 200;
const MAX_MESSAGE_CHARS = 2000;
const MIN_NAME_WORDS = 5;

function countWords(s: string) {
  return String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const enquiryType = String(body.enquiryType ?? "GENERAL").trim().toUpperCase();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const userMessage = String(body.message ?? "").trim();

    // Conditional fields (optional)
    const courseInterestedIn = String(body.courseInterestedIn ?? "").trim();
    const preferredStartDate = String(body.preferredStartDate ?? "").trim();
    const studyMode = String(body.studyMode ?? "").trim();
    const scholarshipType = String(body.scholarshipType ?? "").trim();
    const applicationRef = String(body.applicationRef ?? "").trim();
    const paymentRef = String(body.paymentRef ?? "").trim();
    const bestContactMethod = String(body.bestContactMethod ?? "").trim();

    // Anti-bot
    const hp = String(body.hp ?? "").trim();
    const turnstileToken = String(body.turnstileToken ?? "").trim();

    // Honeypot: if filled → bot
    if (hp) {
      return NextResponse.json({ message: "Request blocked." }, { status: 400 });
    }

    // ================================
    // ✅ STRICT SERVER-SIDE VALIDATION
    // ================================
    if (!fullName || countWords(fullName) < MIN_NAME_WORDS) {
      return NextResponse.json(
        {
          message: `Please enter your full name using at least ${MIN_NAME_WORDS} words.`,
        },
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

    // Light rule: if application progress, require a ref
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

    // Turnstile verification
    const ts = await verifyTurnstile(turnstileToken, ip);
    if (!ts.ok) {
      return NextResponse.json(
        { message: ts.reason || "Security check failed. Please try again." },
        { status: 400 }
      );
    }

    // Store structured info inside message (no schema change)
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
    `;

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
    `;

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
      if (isProd) console.error(msg);
      else console.warn(msg);
    }

    return NextResponse.json(
      { enquiryRef, message: "Thanks—your enquiry has been received." },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("ENQUIRY_API_ERROR:", err?.name, err?.message);

    return NextResponse.json(
      {
        message:
          "Something went wrong sending your enquiry. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
