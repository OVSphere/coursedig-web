"use client";

import { useState } from "react";
import Link from "next/link";

export default function EnquiryPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [enquiryRef, setEnquiryRef] = useState<string | null>(null);

  const isValid = fullName.trim() !== "" && email.includes("@") && message.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!isValid) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, message }),
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
          <h1 className="text-3xl font-bold text-gray-900">Course Enquiry</h1>
          <p className="mt-2 text-sm text-gray-700">
            Tell us what you’re interested in and our team will respond by email.
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
                Your reference:{" "}
                <span className="font-mono font-semibold">{enquiryRef}</span>
              </p>
              <p className="mt-2 text-sm text-gray-600">
                We will respond by email as soon as possible.
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
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  placeholder="+44 7xxx xxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
                  rows={5}
                  placeholder="Tell us what you’d like to know"
                  required
                />
              </div>

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
