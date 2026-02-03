"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import TurnstileWidget from "@/app/components/TurnstileWidget";

const MIN_PASSWORD_LEN = 8;

async function safeReadError(res: Response): Promise<string> {
  // Try JSON first
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const j = await res.json().catch(() => null);
    if (j?.message) return String(j.message);
    if (j?.error) return String(j.error);
    return `Request failed (HTTP ${res.status}).`;
  }

  // Fallback to text
  const t = await res.text().catch(() => "");
  const cleaned = (t || "").trim();
  if (cleaned) return cleaned.slice(0, 600); // prevent huge dumps
  return `Request failed (HTTP ${res.status}).`;
}

export default function RegisterClient() {
  const sp = useSearchParams();
  const next = useMemo(() => sp.get("next") || "/apply", [sp]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [captchaToken, setCaptchaToken] = useState("");
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function isEmailLike(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  const canSubmit =
    !busy &&
    isEmailLike(email) &&
    password.length >= MIN_PASSWORD_LEN &&
    !!captchaToken;

  const inputClass =
    "mt-2 w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 " +
    "placeholder:text-gray-400 outline-none focus:border-[color:var(--color-brand)] " +
    "focus:ring-2 focus:ring-[color:var(--color-brand-soft)]";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isEmailLike(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < MIN_PASSWORD_LEN) {
      setError(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (!captchaToken) {
      setError("Please complete the captcha to continue.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // NOTE: do NOT send "next" here unless your API expects it
        body: JSON.stringify({ fullName, email, password, captchaToken }),
      });

      if (!res.ok) {
        const msg = await safeReadError(res);
        setError(msg);
        return;
      }

      // success JSON (or fallback)
      const data = await res.json().catch(() => ({}));
      setSuccess(
        data?.message ||
          "Account created. Please check your email to verify your address before logging in."
      );
    } catch (e: any) {
      setError(e?.message || "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-140px)] bg-[color:var(--color-brand-soft)]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left: marketing panel */}
          <div className="hidden lg:block">
            <div className="max-w-lg">
              <h1 className="text-3xl font-bold text-gray-900">Create your account</h1>

              <p className="mt-4 text-sm leading-6 text-gray-700">
                Create an account so you can{" "}
                <span className="font-semibold text-gray-900">complete your application</span>,{" "}
                optionally <span className="font-semibold text-gray-900">upload documents</span>, and
                get clear updates on the next steps.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-red-100 bg-white/70 p-5">
                  <p className="text-sm font-semibold text-gray-900">What happens next?</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[color:var(--color-brand)]">
                        1
                      </span>
                      We send a quick email verification link.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[color:var(--color-brand)]">
                        2
                      </span>
                      You log in and complete your application.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[color:var(--color-brand)]">
                        3
                      </span>
                      We review and contact you with next steps.
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-red-100 bg-white/70 p-5">
                  <p className="text-sm font-semibold text-gray-900">Not sure which course to pick?</p>
                  <p className="mt-1 text-sm text-gray-700">
                    Send an enquiry and we’ll guide you to the best pathway for your goals.
                  </p>
                  <Link
                    href="/enquiry"
                    className="mt-3 inline-flex items-center text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                  >
                    Get free guidance →
                  </Link>
                </div>
              </div>

              <p className="mt-6 text-xs text-gray-500">
                Your details are handled securely. Verification is required before you can log in.
              </p>
            </div>
          </div>

          {/* Right: form card */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Create your account to apply. You’ll verify your email before logging in.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  <p className="font-semibold">Almost there!</p>
                  <p className="mt-1">{success}</p>
                  <p className="mt-2">
                    After verifying,{" "}
                    <Link
                      href={`/login?next=${encodeURIComponent(next)}`}
                      className="font-semibold text-[color:var(--color-brand)] hover:underline"
                    >
                      log in to continue your application →
                    </Link>
                  </p>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-900">Full name (optional)</label>
                  <input
                    className={inputClass}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Smith"
                    autoComplete="name"
                  />
                </div>

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

                <div>
                  <label className="text-sm font-semibold text-gray-900">Password</label>
                  <input
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`Minimum ${MIN_PASSWORD_LEN} characters`}
                    autoComplete="new-password"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Minimum {MIN_PASSWORD_LEN} characters.
                  </p>
                </div>

                <div className="pt-1">
                  <TurnstileWidget onToken={setCaptchaToken} theme="light" />
                  <p className="mt-2 text-xs text-gray-500">Please complete the captcha to continue.</p>
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
                  {busy ? "Creating account…" : "Create account"}
                </button>

                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    className="font-semibold text-[color:var(--color-brand)] hover:underline"
                    href={`/login?next=${encodeURIComponent(next)}`}
                  >
                    Sign in
                  </Link>
                </p>
              </form>

              <div className="mt-6 text-xs text-gray-500">
                By creating an account, you agree to our{" "}
                <Link href="/terms" className="hover:underline">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="hover:underline">
                  Privacy Policy
                </Link>
                .
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-red-100 bg-white/70 p-5 lg:hidden">
              <p className="text-sm font-semibold text-gray-900">Create your account</p>
              <p className="mt-1 text-sm text-gray-700">
                Verify your email, then log in to complete your application.
              </p>
              <Link
                href="/enquiry"
                className="mt-3 inline-flex items-center text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
              >
                Get free guidance →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
