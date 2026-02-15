// frontend/src/lib/mailer.ts
import nodemailer from "nodemailer";

function env(name: string) {
  return (process.env[name] ?? "").trim();
}

export function emailConfigured() {
  return Boolean(env("SMTP_HOST") && env("SMTP_PORT") && env("SMTP_USER") && env("SMTP_PASS"));
}

export function getTransport() {
  const host = env("SMTP_HOST");
  const port = Number(env("SMTP_PORT") || "465");
  const secure = (env("SMTP_SECURE") || "true").toLowerCase() === "true";
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");

  if (!host || !port || !user || !pass) {
    throw new Error("SMTP is not configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }) {
  const from = env("SES_FROM_EMAIL") || env("SMTP_USER");
  const transporter = getTransport();

  return transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
