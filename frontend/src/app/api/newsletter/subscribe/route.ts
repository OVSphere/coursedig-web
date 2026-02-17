// frontend/src/app/api/newsletter/subscribe/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailConfigured, sendEmail } from "@/lib/mailer";

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function buildNewsletterConfirmHtml(params: { email: string }) {
  const { email } = params;

  return `
  <div style="font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #111;">
    <h2 style="margin:0 0 12px 0;">You’re subscribed</h2>
    <p style="margin:0 0 12px 0;">
      Thanks for subscribing to CourseDig updates.
    </p>
    <p style="margin:0 0 12px 0;">
      We’ll email you about new courses, scholarship updates, and enrolment windows.
    </p>
    <p style="margin:18px 0 0 0;font-size:12px;color:#555;">
      This confirmation was sent to: <strong>${email}</strong>
    </p>
  </div>
  `.trim();
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!isEmailLike(email)) {
      return NextResponse.json({ message: "Enter a valid email." }, { status: 400 });
    }

    // ✅ Upsert so:
    // - first time: creates row
    // - already exists: re-activates subscription cleanly
    const sub = await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true },
      create: { email, isActive: true },
      select: { id: true, isActive: true },
    });

    // ✅ Best-effort confirmation email (never blocks success)
    (async () => {
      try {
        const isProd = process.env.NODE_ENV === "production";

        if (!isProd) {
          console.log("DEV NEWSLETTER SUBSCRIBE: confirmation email would send to:", email);
          return;
        }

        if (!emailConfigured()) return;

        await sendEmail({
          to: email,
          subject: "CourseDig subscription confirmed",
          html: buildNewsletterConfirmHtml({ email }),
          text: "You’re subscribed to CourseDig updates.",
        });
      } catch (sendErr) {
        console.error("NEWSLETTER_CONFIRM_EMAIL_SEND_ERROR:", sendErr);
      }
    })();

    // ✅ Always 200 so UI can just show success
    // Provide status for analytics/UI if you want
    return NextResponse.json(
      { status: sub.isActive ? "subscribed" : "subscribed" },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("NEWSLETTER_SUBSCRIBE_ERROR:", e?.name, e?.message || e);
    return NextResponse.json({ message: "Subscribe failed. Please try again." }, { status: 500 });
  }
}
