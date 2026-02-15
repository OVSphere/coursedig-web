//frontend/src/app/enquiry/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import TurnstileWidget from "@/app/components/TurnstileWidget";

type EnquiryType =
  | "GENERAL"
  | "COURSE"
  | "SCHOLARSHIP"
  | "APPLICATION_PROGRESS"
  | "PAYMENTS"
  | "TECH_SUPPORT"
  | "PARTNERSHIP"
  | "OTHER";

const MIN_MESSAGE_CHARS = 200;
const MAX_MESSAGE_CHARS = 2000;

// ✅ realistic full-name requirement
const MIN_NAME_WORDS = 2;

const ENQUIRY_TYPES_RAW: { value: EnquiryType; label: string; hint: string }[] = [
  { value: "GENERAL", label: "General enquiry", hint: "Questions about CourseDig or our services." },
  { value: "COURSE", label: "Course enquiry", hint: "Ask about a course, start dates, entry requirements, etc." },
  { value: "SCHOLARSHIP", label: "Scholarship enquiry", hint: "Ask about scholarship eligibility and process." },
  { value: "APPLICATION_PROGRESS", label: "Application progress / update", hint: "Check status, update details, upload missing docs." },
  { value: "PAYMENTS", label: "Payments / fees", hint: "Tuition fees, invoices, payment confirmation." },
  { value: "TECH_SUPPORT", label: "Technical support", hint: "Website issues or access problems." },
  { value: "PARTNERSHIP", label: "Partnership / corporate training", hint: "Business partnerships or corporate training." },
  { value: "OTHER", label: "Other", hint: "Anything else." },
];

const ENQUIRY_TYPES = [...ENQUIRY_TYPES_RAW].sort((a, b) =>
  a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
);

function normalizeSpaces(s: string) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function countWords(s: string) {
  const v = normalizeSpaces(s);
  if (!v) return 0;
  return v.split(" ").filter(Boolean).length;
}

function isValidEmail(email: string) {
  const v = String(email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export default function EnquiryPage() {
  const [enquiryType, setEnquiryType] = useState<EnquiryType>("GENERAL");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [applicationRef, setApplicationRef] = useState("");
  const [hp, setHp] = useState("");

  // Turnstile
  const [turnstileToken, setTurnstileToken] = useState("");
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);

  // UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [enquiryRef, setEnquiryRef] = useState<string | null>(null);

  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedMessage, setTouchedMessage] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || "";
  const captchaEnabled = !!siteKey;

  const nameWords = useMemo(() => countWords(fullName), [fullName]);
  const nameOk = useMemo(() => nameWords >= MIN_NAME_WORDS, [nameWords]);
  const emailOk = useMemo(() => isValidEmail(email), [email]);

  const msgLen = useMemo(() => String(message || "").length, [message]);
  const msgOk = useMemo(
    () => msgLen >= MIN_MESSAGE_CHARS && msgLen <= MAX_MESSAGE_CHARS,
    [msgLen]
  );

  // Only show Turnstile when key fields are already valid
  const canShowCaptcha = useMemo(() => {
    if (!captchaEnabled) return false;
    return nameOk && emailOk && msgOk;
  }, [captchaEnabled, nameOk, emailOk, msgOk]);

  const isValid = useMemo(() => {
    if (!nameOk) return false;
    if (!emailOk) return false;
    if (!msgOk) return false;

    if (enquiryType === "APPLICATION_PROGRESS" && normalizeSpaces(applicationRef).length < 6) {
      return false;
    }

    if (captchaEnabled) {
      if (!canShowCaptcha) return false;
      if (!turnstileToken) return false;
    }

    return true;
  }, [
    nameOk,
    emailOk,
    msgOk,
    enquiryType,
    applicationRef,
    captchaEnabled,
    canShowCaptcha,
    turnstileToken,
  ]);

  const typeHint = useMemo(
    () => ENQUIRY_TYPES.find((t) => t.value === enquiryType)?.hint || "",
    [enquiryType]
  );

  // If user edits key fields after captcha passed, reset token to avoid stale “Success”
  function resetCaptchaIfNeeded() {
    if (!captchaEnabled) return;
    if (!turnstileToken) return;
    setTurnstileToken("");
    setCaptchaResetSignal((x) => x + 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    setTouchedName(true);
    setTouchedEmail(true);
    setTouchedMessage(true);

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enquiryType,
          fullName: normalizeSpaces(fullName),
          email: String(email).trim().toLowerCase(),
          phone,
          message,
          applicationRef,
          hp,
          captchaToken: turnstileToken, // ✅ align naming with your server pattern
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(data?.message ?? "Something went wrong. Please try again.");
        // reset captcha on failure so they can retry cleanly
        if (captchaEnabled) {
          setTurnstileToken("");
          setCaptchaResetSignal((x) => x + 1);
        }
        return;
      }

      setEnquiryRef(data.enquiryRef || "ENQ-RECEIVED");
    } catch {
      setSubmitError("Network error. Please try again.");
      if (captchaEnabled) {
        setTurnstileToken("");
        setCaptchaResetSignal((x) => x + 1);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">Contact & Enquiries</h1>
          <p className="mt-2 text-sm text-gray-700">
            Use this form for general questions, course and scholarship enquiries, payment queries, or application progress.
            You can also browse all courses{" "}
            <Link
              href="/courses"
              className="font-semibold text-[color:var(--color-brand)] hover:underline"
            >
              here
            </Link>
            .
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-10">
          {enquiryRef ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
              <p className="text-base font-semibold text-gray-900">
                Thank you — your enquiry has been received.
              </p>
              <p className="mt-2 text-sm text-gray-700">
                Your reference: <span className="font-mono font-semibold">{enquiryRef}</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">We’ll respond by email as soon as possible.</p>

              <div className="mt-6 flex gap-3">
                <Link
                  href="/courses"
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Browse courses
                </Link>
                <Link
                  href="/"
                  className="rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
                >
                  Back to home
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900">Enquiry type</label>
                <select
                  value={enquiryType}
                  onChange={(e) => {
                    setEnquiryType(e.target.value as EnquiryType);
                    resetCaptchaIfNeeded();
                  }}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                >
                  {ENQUIRY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {typeHint && <p className="mt-2 text-xs text-gray-600">{typeHint}</p>}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Full name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      resetCaptchaIfNeeded();
                    }}
                    onBlur={() => setTouchedName(true)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                    placeholder="Your full name"
                    required
                  />
                  {touchedName && !nameOk && (
                    <p className="mt-2 text-xs text-red-600">
                      Please enter your full name (at least {MIN_NAME_WORDS} words).
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      resetCaptchaIfNeeded();
                    }}
                    onBlur={() => setTouchedEmail(true)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                    placeholder="you@example.com"
                    required
                  />
                  {touchedEmail && !emailOk && (
                    <p className="mt-2 text-xs text-red-600">Please enter a valid email address.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  placeholder="+44 7xxx xxxxxx"
                />
              </div>

              {enquiryType === "APPLICATION_PROGRESS" && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Application details</p>
                  <label className="block text-sm font-semibold text-gray-900">
                    Application reference <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationRef}
                    onChange={(e) => {
                      setApplicationRef(e.target.value);
                      resetCaptchaIfNeeded();
                    }}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none"
                    placeholder="e.g., APP-APPLICATION-1975-20260208-0004"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    const v = e.target.value || "";
                    setMessage(v.length > MAX_MESSAGE_CHARS ? v.slice(0, MAX_MESSAGE_CHARS) : v);
                    resetCaptchaIfNeeded();
                  }}
                  onBlur={() => setTouchedMessage(true)}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  rows={7}
                  placeholder={`Please provide details (min ${MIN_MESSAGE_CHARS} characters).`}
                  required
                />

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className={msgOk ? "text-gray-600" : "text-red-600"}>
                    {msgLen < MIN_MESSAGE_CHARS
                      ? `Minimum ${MIN_MESSAGE_CHARS} characters required.`
                      : msgLen > MAX_MESSAGE_CHARS
                      ? `Maximum ${MAX_MESSAGE_CHARS} characters exceeded.`
                      : "Looks good."}
                  </span>
                  <span className="text-gray-500">
                    {msgLen}/{MAX_MESSAGE_CHARS}
                  </span>
                </div>

                {touchedMessage && !msgOk && (
                  <p className="mt-2 text-xs text-red-600">
                    Your message must be between {MIN_MESSAGE_CHARS} and {MAX_MESSAGE_CHARS} characters.
                  </p>
                )}
              </div>

              {/* Honeypot */}
              <div className="hidden">
                <label className="block text-sm font-semibold text-gray-900">Do not fill</label>
                <input
                  type="text"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Turnstile only when form is ready */}
              {captchaEnabled && (
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold text-gray-500">SECURITY CHECK</p>

                  {!canShowCaptcha ? (
                    <p className="mt-3 text-sm text-gray-600">
                      Please complete the form above to enable the security check.
                    </p>
                  ) : (
                    <div className="mt-3">
                      <TurnstileWidget
                        onToken={(t) => setTurnstileToken(t)}
                        theme="light"
                        resetSignal={captchaResetSignal}
                        appearance="interaction-only"
                        action="enquiry_submit"
                      />
                    </div>
                  )}

                  <p className="mt-2 text-xs text-gray-600">
                    This helps us reduce spam and keep the service safe.
                  </p>
                </div>
              )}

              {submitError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className={`w-full rounded-md px-6 py-3 text-sm font-semibold text-white ${
                  isValid && !isSubmitting
                    ? "bg-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-dark)]"
                    : "cursor-not-allowed bg-gray-400"
                }`}
              >
                {isSubmitting ? "Submitting..." : "Submit enquiry"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
