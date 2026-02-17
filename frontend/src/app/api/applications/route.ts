// src/app/api/applications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { emailConfigured, sendEmail } from "@/lib/mailer";
import { UPLOAD_LIMITS, UPLOAD_LIMIT_BYTES } from "@/lib/uploadLimits";

const DEV_FORCE_EMAIL = process.env.DEV_FORCE_EMAIL; // optional for dev testing

// Use role-based “from” if provided (recommended)
const EMAIL_FROM_ADMISSIONS =
  process.env.EMAIL_FROM_ADMISSIONS ||
  process.env.ADMISSIONS_FROM_EMAIL ||
  "admissions@coursedig.com";

// Admin notification mailbox
const APPLICATIONS_ADMIN_EMAIL =
  process.env.APPLICATIONS_ADMIN_EMAIL ||
  process.env.SES_ADMIN_EMAIL || // keep backward compat if you already set this
  "admissions@coursedig.com";

const MAX_FILES = UPLOAD_LIMITS.MAX_FILES;
const MAX_TOTAL_BYTES = UPLOAD_LIMIT_BYTES.MAX_TOTAL_BYTES;
const MAX_PER_FILE_BYTES = UPLOAD_LIMIT_BYTES.MAX_PER_FILE_BYTES;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function ymdKey(date = new Date()) {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function cleanSurname(s: string) {
  return s.trim().toUpperCase().replace(/\s+/g, "").replace(/[^A-Z]/g, "");
}

// Accepts "DDMMYYYY" OR "DD/MM/YYYY" OR "DD-MM-YYYY"
function parseDobToDate(dobRaw: unknown): { dobDate: Date | null; yob: string | null } {
  if (!dobRaw) return { dobDate: null, yob: null };

  const s = String(dobRaw).trim();
  if (!s) return { dobDate: null, yob: null };

  const digits = s.replace(/[^\d]/g, "");
  if (digits.length !== 8) return { dobDate: null, yob: null };

  const dd = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const yyyy = Number(digits.slice(4, 8));

  const nowYear = new Date().getFullYear();
  if (yyyy < 1900 || yyyy > nowYear) return { dobDate: null, yob: null };
  if (mm < 1 || mm > 12) return { dobDate: null, yob: null };
  if (dd < 1 || dd > 31) return { dobDate: null, yob: null };

  const dobDate = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (Number.isNaN(dobDate.getTime())) return { dobDate: null, yob: null };

  // prevent rollover
  if (
    dobDate.getUTCFullYear() !== yyyy ||
    dobDate.getUTCMonth() !== mm - 1 ||
    dobDate.getUTCDate() !== dd
  ) {
    return { dobDate: null, yob: null };
  }

  return { dobDate, yob: String(yyyy) };
}

async function generateAppRef(
  applicationType: "COURSE" | "SCHOLARSHIP",
  lastName: string,
  yob: string
) {
  const dateKey = ymdKey(); // YYYYMMDD
  const surname = cleanSurname(lastName) || "SURNAME";

  const counterKey = `${dateKey}-${applicationType}`;

  const counter = await prisma.applicationCounter.upsert({
    where: { dateKey: counterKey },
    update: { lastValue: { increment: 1 } },
    create: { dateKey: counterKey, lastValue: 1 },
    select: { lastValue: true },
  });

  const seq = String(counter.lastValue).padStart(4, "0");

  // ✅ no spaces; consistent ref format
  const prefix = applicationType === "SCHOLARSHIP" ? "SCHOLAR-APP" : "APP";

  return `${prefix}-${surname}-${yob}-${dateKey}-${seq}`;
}

function minLen(s: string, n: number) {
  return String(s ?? "").trim().length >= n;
}

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? "").trim());
}

// ✅ SMTP send helper:
// - in dev you can force delivery to one inbox (DEV_FORCE_EMAIL)
// - never blocks application submission if email fails
async function sendAppEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
}) {
  const isProd = process.env.NODE_ENV === "production";
  const finalTo = !isProd && DEV_FORCE_EMAIL ? DEV_FORCE_EMAIL : params.to;

  if (!isProd && DEV_FORCE_EMAIL) {
    console.log(`DEV_EMAIL_OVERRIDE: "${params.to}" -> "${finalTo}"`);
  }

  // If SMTP not configured, just skip (do not block submission)
  if (!emailConfigured()) {
    console.warn("SMTP not configured; skipping email send.");
    return;
  }

  try {
    await sendEmail({
      to: finalTo,
      subject: params.subject,
      html: params.html,
      text: params.text,
      from: params.from,
    });
  } catch (err: any) {
    console.error("SMTP_SEND_ERROR:", err?.name, err?.message || err);
    // Do not throw — submission must still succeed
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: "Unauthorised" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    const applicationTypeRaw = String(body.applicationType ?? "COURSE").toUpperCase();
    const applicationType: "COURSE" | "SCHOLARSHIP" =
      applicationTypeRaw === "SCHOLARSHIP" ? "SCHOLARSHIP" : "COURSE";

    const courseName = String(body.courseName ?? "").trim();
    const otherCourseName = String(body.otherCourseName ?? "").trim();

    const firstName = String(body.firstName ?? "").trim();
    const lastName = String(body.lastName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const countryOfResidence = String(body.countryOfResidence ?? "").trim();

    // unify: accept personalStatement OR message
    const personalStatement = String(body.personalStatement ?? body.message ?? "").trim();

    const needsOtherCourse =
      courseName.toUpperCase() === "OTHER" || courseName.toUpperCase() === "OTHERS";

    const { dobDate, yob } = parseDobToDate(body.dob);

    const attachments = Array.isArray(body.attachments) ? body.attachments : [];

    // Required validations
    if (!courseName) {
      return NextResponse.json({ message: "Course name is required." }, { status: 400 });
    }
    if (needsOtherCourse && otherCourseName.trim().length < 5) {
      return NextResponse.json(
        { message: "Other course name is required (min 5 characters)." },
        { status: 400 }
      );
    }

    if (!minLen(firstName, 2) || !minLen(lastName, 2)) {
      return NextResponse.json(
        { message: "First name and last name are required." },
        { status: 400 }
      );
    }

    if (!dobDate || !yob) {
      return NextResponse.json(
        { message: "Date of birth is required (DD/MM/YYYY)." },
        { status: 400 }
      );
    }

    if (!isEmailLike(email)) {
      return NextResponse.json({ message: "Valid email is required." }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ message: "Phone number is required." }, { status: 400 });
    }

    if (!minLen(countryOfResidence, 2)) {
      return NextResponse.json({ message: "Country of residence is required." }, { status: 400 });
    }

    if (!minLen(personalStatement, 50)) {
      return NextResponse.json(
        { message: "Personal statement must be at least 50 characters." },
        { status: 400 }
      );
    }

    // Attachments validation
    if (attachments.length > MAX_FILES) {
      return NextResponse.json({ message: `Max ${MAX_FILES} files allowed.` }, { status: 400 });
    }

    let totalBytes = 0;

    for (const a of attachments) {
      const fileName = String(a.fileName ?? a.name ?? "").trim();
      const mimeType = String(a.mimeType ?? a.type ?? "").trim();
      const sizeBytes = Number(a.sizeBytes ?? a.size ?? 0);
      const s3Key = String(a.s3Key ?? a.key ?? "").trim();

      if (!fileName || !mimeType || !s3Key || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
        return NextResponse.json({ message: "Invalid attachment payload." }, { status: 400 });
      }
      if (!ALLOWED_MIME.has(mimeType)) {
        return NextResponse.json({ message: "Only PDF and images are allowed." }, { status: 400 });
      }
      if (sizeBytes > MAX_PER_FILE_BYTES) {
        return NextResponse.json(
          { message: `Each file must be <= ${UPLOAD_LIMITS.MAX_PER_FILE_MB}MB.` },
          { status: 400 }
        );
      }

      totalBytes += sizeBytes;
      if (totalBytes > MAX_TOTAL_BYTES) {
        return NextResponse.json(
          { message: `Total attachments too large (max ${UPLOAD_LIMITS.MAX_TOTAL_MB}MB).` },
          { status: 400 }
        );
      }
    }

    const appRef = await generateAppRef(applicationType, lastName, yob);

    const created = await prisma.application.create({
      data: {
        appRef,
        userId: user.id,

        applicationType,
        courseName,
        otherCourseName: needsOtherCourse ? otherCourseName : null,

        firstName,
        lastName,
        dob: dobDate,
        email,
        phone,
        countryOfResidence,
        personalStatement,

        attachments: {
          create: attachments.map((a: any) => ({
            fileName: String(a.fileName ?? a.name ?? ""),
            mimeType: String(a.mimeType ?? a.type ?? ""),
            sizeBytes: Number(a.sizeBytes ?? a.size ?? 0),
            s3Key: String(a.s3Key ?? a.key ?? ""),
            s3Url: a.s3Url ? String(a.s3Url) : null,
          })),
        },
      },
      include: { attachments: true },
    });

    const formLabel =
      applicationType === "SCHOLARSHIP" ? "Scholarship Application" : "Course Application";

    const userSubject = `CourseDig ${formLabel} Received: ${appRef}`;
    const adminSubject = `New CourseDig ${formLabel}: ${appRef}`;

    const userText =
      `Thank you — your ${formLabel.toLowerCase()} has been received.\n` +
      `Reference: ${appRef}\n` +
      `We will contact you by email.\n`;

    const userHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Thank you — your ${formLabel.toLowerCase()} has been received.</h2>
        <p><strong>Your reference:</strong> ${appRef}</p>
        <p>We will contact you by email.</p>
      </div>
    `;

    const adminText =
      `New ${formLabel.toLowerCase()} received\n\n` +
      `Ref: ${appRef}\n` +
      `Type: ${applicationType}\n` +
      `Course: ${courseName}${needsOtherCourse ? ` (Other: ${otherCourseName})` : ""}\n` +
      `Name: ${firstName} ${lastName}\n` +
      `YOB: ${yob}\n` +
      `Email: ${email}\n` +
      `Phone: ${phone}\n` +
      `Country: ${countryOfResidence}\n` +
      `Files: ${created.attachments.length}\n`;

    const adminHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>New ${formLabel.toLowerCase()} received</h2>
        <p><strong>Ref:</strong> ${appRef}</p>
        <p>
          <strong>Type:</strong> ${applicationType}<br/>
          <strong>Course:</strong> ${courseName}${needsOtherCourse ? ` (Other: ${otherCourseName})` : ""}<br/>
          <strong>Name:</strong> ${firstName} ${lastName}<br/>
          <strong>YOB:</strong> ${yob}<br/>
          <strong>Email:</strong> ${email}<br/>
          <strong>Phone:</strong> ${phone}<br/>
          <strong>Country:</strong> ${countryOfResidence}<br/>
          <strong>Files:</strong> ${created.attachments.length}
        </p>
      </div>
    `;

    // ✅ Best-effort emails (never block submission)
    await sendAppEmail({
      to: email,
      subject: userSubject,
      html: userHtml,
      text: userText,
      from: EMAIL_FROM_ADMISSIONS,
    });

    await sendAppEmail({
      to: APPLICATIONS_ADMIN_EMAIL,
      subject: adminSubject,
      html: adminHtml,
      text: adminText,
      from: EMAIL_FROM_ADMISSIONS,
    });

    return NextResponse.json(
      { appRef, message: "Thanks—your application has been received." },
      { status: 200 }
    );
  } catch (err) {
    console.error("APPLICATION_SUBMIT_ERROR:", err);
    return NextResponse.json({ message: "Application submit failed." }, { status: 500 });
  }
}
