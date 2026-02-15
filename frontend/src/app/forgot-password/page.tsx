//frontend/src/app/forgot-password/page.tsx
"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TurnstileWidget from "@/app/components/TurnstileWidget";

export default function ForgotPasswordPage() {
  const sp = useSearchParams();
  const next = useMemo(() => sp.get("next") || "/apply", [sp]);
  const emailPrefill = useMemo(() => sp.get("email") || "", [sp]);

  const [email, setEmail] = useState(emailPrefill);
  const [captchaToken, setCaptchaToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "mt-2 w-full rounded-md border border-gray-300 bg-white text-gray-900 " +
    "placeholder-gray-400 px-4 py-3 text-sm outline-none " +
    "focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || "Request failed.");
        return;
      }

      setMessage(
        json.message ||
          "If an account exists for this email, a password reset link has been sent."
      );
    } catch (e: any) {
      setError(e?.message || "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-140px)] bg-[color:var(--color-brand-soft)]">
      <div className="mx-auto max-w-xl px-6 py-14">
        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Forgot password</h1>
          <p className="mt-1 text-sm text-gray-600">
            Enter your email and we’ll send you a reset link.
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              {message}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-900">Email</label>
              <input
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                inputMode="email"
                autoComplete="email"
              />
            </div>

            <div className="pt-1">
              <TurnstileWidget onToken={setCaptchaToken} theme="light" />
              <p className="mt-2 text-xs text-gray-500">
                Please complete the captcha to continue.
              </p>
            </div>

            <button
              type="submit"
              disabled={busy || !captchaToken}
              className={`w-full rounded-md px-6 py-3 text-sm font-semibold text-white ${
                busy || !captchaToken
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-dark)]"
              }`}
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link
                className="font-semibold text-[color:var(--color-brand)] hover:underline"
                href={`/login?next=${encodeURIComponent(next)}&email=${encodeURIComponent(email)}`}
              >
                Back to login
              </Link>

              <Link className="text-gray-600 hover:underline" href="/enquiry">
                Need help?
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
