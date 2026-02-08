//src/app/verify-email-gate/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import TurnstileWidget from "@/app/components/TurnstileWidget";

type Status = "idle" | "sending" | "sent" | "error";

export default function VerifyEmailGatePage() {
  const sp = useSearchParams();
  const router = useRouter();

  const next = useMemo(() => sp.get("next") || "/apply", [sp]);

  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  // UI cooldown (60s)
  const [cooldown, setCooldown] = useState(0);

  // countdown tick
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((c) => (c <= 1 ? 0 : c - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function resendVerification() {
    setMessage(null);

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      return;
    }

    if (!captchaToken) {
      setMessage("Please complete the captcha to continue.");
      return;
    }

    setStatus("sending");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          captchaToken,
        }),
      });

      if (res.status === 429) {
        setMessage("Too many requests. Please try again later.");
        setStatus("error");
        return;
      }

      const data = await res.json().catch(() => ({}));

      // Always neutral language (no enumeration)
      setMessage(
        data?.message ||
          "If an account exists for this email, a verification link has been sent."
      );

      setStatus("sent");
      setCooldown(60);
      setCaptchaToken("");
    } catch (e) {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <main className="min-h-[calc(100vh-140px)] bg-[color:var(--color-brand-soft)]">
      <div className="mx-auto max-w-md px-6 py-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Verify your email to continue
          </h1>

          <p className="mt-3 text-sm text-gray-700">
            Please verify your email address to continue. This helps us keep your
            account secure and ensures we can contact you about your application.
          </p>

          {message && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
              {message}
            </div>
          )}

          {/* Email input */}
          <div className="mt-6">
            <label className="text-sm font-semibold text-gray-900">
              Email address
            </label>
            <input
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900
                         outline-none focus:border-[color:var(--color-brand)]
                         focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "sending"}
            />
          </div>

          {/* CAPTCHA */}
          <div className="mt-5">
            <TurnstileWidget onToken={setCaptchaToken} theme="light" />
          </div>

          {/* Resend button */}
          <button
            type="button"
            onClick={resendVerification}
            disabled={status === "sending" || cooldown > 0}
            className={`mt-5 w-full rounded-md px-6 py-3 text-sm font-semibold text-white ${
              status === "sending" || cooldown > 0
                ? "cursor-not-allowed bg-gray-400"
                : "bg-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-dark)]"
            }`}
          >
            {cooldown > 0
              ? `Resend available in ${cooldown}s`
              : status === "sending"
              ? "Sending…"
              : "Resend verification email"}
          </button>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <Link
              href="/register"
              onClick={() => {
                // ensure user exits current session cleanly
                fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
              }}
              className="block text-center text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
            >
              Create a new account
            </Link>

            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="block text-center text-sm text-gray-600 hover:underline"
            >
              Back to login
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-500">
            If you no longer have access to your email inbox, you’ll need to
            create a new account.
          </p>
        </div>
      </div>
    </main>
  );
}
