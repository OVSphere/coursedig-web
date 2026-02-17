// frontend/src/lib/mailer.ts
import nodemailer from "nodemailer";

function env(name: string) {
  return (process.env[name] ?? "").trim();
}

function toBool(v: string, fallback: boolean) {
  const s = (v || "").trim().toLowerCase();
  if (!s) return fallback;
  return s === "true" || s === "1" || s === "yes";
}

function toInt(v: string, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function getDefaultFromEmail() {
  // Backward compatible + supports better names
  return (
    env("SES_FROM_EMAIL") ||
    env("SMTP_FROM_EMAIL") ||
    env("EMAIL_FROM") ||
    env("SMTP_USER")
  );
}

export function emailConfigured() {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  return Boolean(host && user && pass);
}

export function getTransport() {
  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");

  const port = toInt(env("SMTP_PORT"), 587);

  const secure = env("SMTP_SECURE")
    ? toBool(env("SMTP_SECURE"), port === 465)
    : port === 465;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },

    connectionTimeout: toInt(env("SMTP_CONNECTION_TIMEOUT_MS"), 10_000),
    greetingTimeout: toInt(env("SMTP_GREETING_TIMEOUT_MS"), 10_000),
    socketTimeout: toInt(env("SMTP_SOCKET_TIMEOUT_MS"), 20_000),

    requireTLS: !secure,

    tls: {
      rejectUnauthorized: env("SMTP_TLS_REJECT_UNAUTHORIZED")
        ? toBool(env("SMTP_TLS_REJECT_UNAUTHORIZED"), true)
        : true,
    },
  });
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string; // ✅ optional override (used by Applications/Enquiries/Newsletter etc.)
}) {
  const from = (opts.from ?? "").trim() || getDefaultFromEmail();
  const transporter = getTransport();

  if (!from) {
    throw new Error("Email FROM address is not configured");
  }

  return transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
}
