// frontend/src/app/forgot-password/ForgotPasswordClient.tsx
"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function isEmailLike(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
}

export default function ForgotPasswordClient() {
  const sp = useSearchParams();
  const next = useMemo(() => sp.get("next") || "/apply", [sp]);
  const emailPrefill = useMemo(() => sp.get("email") || "", [sp]);

  const [email, setEmail] = useState(emailPrefill);

  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [touched, setTouched] = useState(false);

  const emailTrimmed = (email || "").trim().toLowerCase();
  const emailValid = isEmailLike(emailTrimmed);
  const emailInvalid = touched && emailTrimmed.length > 0 && !emailValid;

  const canSubmit = !busy && emailValid;

  const inputClass =
    "mt-2 w-full rounded-md border border-gray-300 bg-white text-gray-900 " +
    "placeholder-gray-400 px-4 py-3 text-sm outline-none " +
    "focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]";

  const inputInvalidClass =
    "mt-2 w-full rounded-md border border-red-300 bg-red-50 text-gray-900 " +
    "placeholder-gray-400 px-4 py-3 text-sm outline-none " +
    "focus:border-red-400 focus:ring-2 focus:ring-red-100";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    setError(null);
    setMessage(null);
    setTouched(true);

    if (!emailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailTrimmed }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.message || "Request failed.");
        return;
      }

      // Keep response neutral (no account enumeration)
      setMessage(
        json.message ||
          "If an account exists for this email, a password reset link has been sent."
      );

      // Optional: clear the field after success (keeps UX clean)
      // Comment out if you prefer to keep the email visible.
      // setEmail("");
      // setTouched(false);
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
                className={emailInvalid ? inputInvalidClass : inputClass}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                  setMessage(null);
                }}
                onBlur={() => setTouched(true)}
                placeholder="you@example.com"
                inputMode="email"
                autoComplete="email"
                disabled={busy}
                required
              />

              {emailInvalid ? (
                <p className="mt-2 text-xs text-red-700">Please enter a valid email address.</p>
              ) : (
                <p className="mt-2 text-xs text-gray-500">
                  Use the email address you registered with.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full rounded-md px-6 py-3 text-sm font-semibold text-white ${
                !canSubmit
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-dark)]"
              }`}
            >
              {busy ? "Sending…" : "Send reset link"}
            </button>

            {!canSubmit ? (
              <p className="text-xs text-gray-500">Enter a valid email address to enable submission.</p>
            ) : null}

            <div className="flex items-center justify-between text-sm">
              <Link
                className="font-semibold text-[color:var(--color-brand)] hover:underline"
                href={`/login?next=${encodeURIComponent(next)}&email=${encodeURIComponent(emailTrimmed)}`}
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
