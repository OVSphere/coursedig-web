// src/lib/emailVerification.ts
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const AWS_REGION =
  process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-west-2";

const ses = new SESClient({ region: AWS_REGION });

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export async function createEmailVerification(userId: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  await prisma.emailVerificationToken.deleteMany({ where: { userId } });

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return rawToken;
}

export async function sendVerificationEmail(to: string, rawToken: string) {
  const baseUrl = normalizeBaseUrl(process.env.APP_BASE_URL || "http://localhost:3000");
  const link = `${baseUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;

  // ✅ DEV convenience: print link instead of emailing
  const devConsoleMode =
    process.env.NODE_ENV !== "production" &&
    (process.env.DEV_EMAIL_MODE || "").toLowerCase() === "console";

  if (devConsoleMode) {
    console.log("✅ DEV EMAIL (verification link):", link);
    return { mode: "console" as const, link };
  }

  const from = process.env.SES_FROM_EMAIL;
  if (!from) throw new Error("SES_FROM_EMAIL is not set");

  const subject = "Verify your CourseDig email";
  const text =
    `Welcome to CourseDig.\n\n` +
    `Please verify your email address to continue:\n${link}\n\n` +
    `This link expires in 24 hours.\n`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Verify your email</h2>
      <p>Please verify your email address to continue.</p>
      <p><a href="${link}">Verify email</a></p>
      <p style="font-size: 12px; color: #666;">This link expires in 24 hours.</p>
    </div>
  `;

  await ses.send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: { Html: { Data: html, Charset: "UTF-8" }, Text: { Data: text, Charset: "UTF-8" } },
      },
    })
  );

  return { mode: "ses" as const };
}

export function hashVerificationToken(rawToken: string) {
  return sha256(rawToken);
}
