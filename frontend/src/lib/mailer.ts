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

/**
 * Backward compatible:
 * - Keeps SES_FROM_EMAIL support (legacy env naming)
 * - Supports SMTP_FROM_EMAIL / EMAIL_FROM
 * - Falls back to SMTP_USER
 */
function getDefaultFromEmail() {
  return (
    env("SES_FROM_EMAIL") ||
    env("SMTP_FROM_EMAIL") ||
    env("EMAIL_FROM") ||
    env("SMTP_USER")
  );
}

/**
 * Optional helper (your build was failing because another file imported this).
 * This lets other routes choose an appropriate "from" address by purpose.
 *
 * Env mapping (you already have these):
 *  - AUTH_FROM_EMAIL
 *  - ADMISSIONS_FROM_EMAIL
 *  - CONTACT_FROM_EMAIL
 *  - NEWSLETTER_FROM_EMAIL
 *
 * Fallback: default from email.
 */
export function getRoleFromEmail(email: string) {
  const e = String(email || "").toLowerCase().trim();

  if (e.startsWith("no-reply@")) return "AUTH";
  if (e.startsWith("admissions@")) return "ADMISSIONS";
  if (e.startsWith("contact@")) return "CONTACT";
  if (e.startsWith("study@")) return "NEWSLETTER";

  return "GENERAL";
}

export function getFromEmailForRole(role: string) {
  const r = String(role || "").toUpperCase().trim();

  const from =
    (r === "AUTH" && env("AUTH_FROM_EMAIL")) ||
    (r === "ADMISSIONS" && env("ADMISSIONS_FROM_EMAIL")) ||
    (r === "CONTACT" && env("CONTACT_FROM_EMAIL")) ||
    (r === "NEWSLETTER" && env("NEWSLETTER_FROM_EMAIL")) ||
    "";

  return from.trim() || getDefaultFromEmail();
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

  // Default 587 (STARTTLS). 465 is implicit TLS.
  const port = toInt(env("SMTP_PORT"), 587);

  // If explicitly set, respect it; otherwise infer from port.
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

    // Reasonable defaults for serverless
    connectionTimeout: toInt(env("SMTP_CONNECTION_TIMEOUT_MS"), 10_000),
    greetingTimeout: toInt(env("SMTP_GREETING_TIMEOUT_MS"), 10_000),
    socketTimeout: toInt(env("SMTP_SOCKET_TIMEOUT_MS"), 20_000),

    // STARTTLS on 587
    requireTLS: !secure,

    tls: {
      // Keep verification ON by default (safer)
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
  from?: string; // optional override
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
