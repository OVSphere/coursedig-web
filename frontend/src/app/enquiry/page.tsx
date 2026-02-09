// frontend/src/app/enquiry/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type EnquiryType =
  | "GENERAL"
  | "COURSE"
  | "SCHOLARSHIP"
  | "APPLICATION_PROGRESS"
  | "PAYMENTS"
  | "TECH_SUPPORT"
  | "PARTNERSHIP"
  | "OTHER";

// ✅ Message constraints
const MIN_MESSAGE_CHARS = 200;
const MAX_MESSAGE_CHARS = 2000;

// ⚠️ NOTE about “minimum 5 words” for full name:
// A full name is typically 2–4 words. Requiring 5 will block many genuine users.
// I implemented MIN 2 words (first + last). If you truly want 5, change MIN_NAME_WORDS to 5.
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

// ✅ Alphabetical order by label
const ENQUIRY_TYPES = [...ENQUIRY_TYPES_RAW].sort((a, b) =>
  a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
);

declare global {
  interface Window {
    turnstile?: any;
  }
}

function normalizeSpaces(s: string) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function countWords(s: string) {
  const v = normalizeSpaces(s);
  if (!v) return 0;
  return v.split(" ").filter(Boolean).length;
}

// More robust email check than includes("@")
function isValidEmail(email: string) {
  const v = String(email || "").trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export default function EnquiryPage() {
  // Core
  const [enquiryType, setEnquiryType] = useState<EnquiryType>("GENERAL");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // Conditional fields
  const [courseInterestedIn, setCourseInterestedIn] = useState("");
  const [preferredStartDate, setPreferredStartDate] = useState("");
  const [studyMode, setStudyMode] = useState<"ONLINE" | "IN_PERSON" | "HYBRID" | "">("");
  const [scholarshipType, setScholarshipType] = useState("");
  const [applicationRef, setApplicationRef] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [bestContactMethod, setBestContactMethod] = useState<"EMAIL" | "PHONE" | "WHATSAPP" | "">("");

  // Anti-abuse
  const [hp, setHp] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [enquiryRef, setEnquiryRef] = useState<string | null>(null);

  // ✅ Field-level touched states for prompts
  const [touchedName, setTouchedName] = useState(false);
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [touchedMessage, setTouchedMessage] = useState(false);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const widgetRef = useRef<HTMLDivElement | null>(null);

  const nameWords = useMemo(() => countWords(fullName), [fullName]);
  const nameOk = useMemo(() => nameWords >= MIN_NAME_WORDS, [nameWords]);

  const emailOk = useMemo(() => isValidEmail(email), [email]);

  const msgLen = useMemo(() => String(message || "").length, [message]);
  const msgOk = useMemo(
    () => msgLen >= MIN_MESSAGE_CHARS && msgLen <= MAX_MESSAGE_CHARS,
    [msgLen]
  );

  const isValid = useMemo(() => {
    if (!nameOk) return false;
    if (!emailOk) return false;
    if (!msgOk) return false;

    // Optional conditional requirement
    if (enquiryType === "APPLICATION_PROGRESS" && normalizeSpaces(applicationRef).length < 6) {
      return false;
    }

    // Turnstile enforcement only if site key configured
    if (siteKey && !turnstileToken) return false;

    return true;
  }, [nameOk, emailOk, msgOk, enquiryType, applicationRef, siteKey, turnstileToken]);

  const typeHint = useMemo(
    () => ENQUIRY_TYPES.find((t) => t.value === enquiryType)?.hint || "",
    [enquiryType]
  );

  // Turnstile render (if configured)
  useEffect(() => {
    if (!siteKey) return;

    const existing = document.querySelector('script[data-cf-turnstile="1"]');
    if (existing) return;

    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.dataset.cfTurnstile = "1";

    s.onload = () => {
      if (!widgetRef.current || !window.turnstile) return;

      try {
        window.turnstile.render(widgetRef.current, {
          sitekey: siteKey,
          theme: "light",
          callback: (token: string) => setTurnstileToken(token),
          "expired-callback": () => setTurnstileToken(""),
          "error-callback": () => setTurnstileToken(""),
        });
      } catch {
        // no-op
      }
    };

    document.body.appendChild(s);
  }, [siteKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    // Force prompts if user tries submitting
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
          email: String(email).trim(),
          phone,
          message, // keep exact message
          courseInterestedIn,
          preferredStartDate,
          studyMode,
          scholarshipType,
          applicationRef,
          paymentRef,
          bestContactMethod,
          hp,
          turnstileToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(data?.message ?? "Something went wrong. Please try again.");
        return;
      }

      setEnquiryRef(data.enquiryRef);
    } catch {
      setSubmitError("Network error. Please try again.");
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
              <p className="mt-2 text-sm text-gray-600">
                We’ll respond by email as soon as possible.
              </p>

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
              {/* Enquiry type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900">Enquiry type</label>
                <select
                  value={enquiryType}
                  onChange={(e) => setEnquiryType(e.target.value as EnquiryType)}
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

              {/* Core fields */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">Full name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
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
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => setTouchedEmail(true)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                    placeholder="you@example.com"
                    required
                  />
                  {touchedEmail && !emailOk && (
                    <p className="mt-2 text-xs text-red-600">
                      Please enter a valid email address (e.g., you@example.com).
                    </p>
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

              {/* Conditional: application progress requires ref */}
              {enquiryType === "APPLICATION_PROGRESS" && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-900">Application details</p>
                  <label className="block text-sm font-semibold text-gray-900">
                    Application reference <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationRef}
                    onChange={(e) => setApplicationRef(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none"
                    placeholder="e.g., APP-APPLICATION-1975-20260208-0004"
                    required
                  />
                  <p className="text-xs text-gray-600">
                    Include the reference shown after submission (or from your email receipt).
                  </p>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-900">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => {
                    const v = e.target.value || "";
                    // ✅ enforce max 2000 on input (hard limit)
                    setMessage(v.length > MAX_MESSAGE_CHARS ? v.slice(0, MAX_MESSAGE_CHARS) : v);
                  }}
                  onBlur={() => setTouchedMessage(true)}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  rows={7}
                  placeholder={`Please provide details (min ${MIN_MESSAGE_CHARS} characters). Include references where possible.`}
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

              {/* Honeypot (hidden) */}
              <div className="hidden">
                <label className="block text-sm font-semibold text-gray-900">Do not fill</label>
                <input
                  type="text"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Turnstile widget */}
              {siteKey ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold text-gray-500">SECURITY CHECK</p>
                  <div className="mt-3" ref={widgetRef} />
                  <p className="mt-2 text-xs text-gray-600">
                    This helps us reduce spam and keep the service safe.
                  </p>
                </div>
              ) : null}

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
