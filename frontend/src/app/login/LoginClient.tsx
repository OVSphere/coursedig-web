// frontend/src/app/login/LoginClient.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Link from "next/link";
import TurnstileWidget from "@/app/components/TurnstileWidget";

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();

  const next = useMemo(() => params.get("next") || "/apply", [params]);
  const emailPrefill = useMemo(() => params.get("email") || "", [params]);

  const [email, setEmail] = useState(emailPrefill);
  const [password, setPassword] = useState("");

  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [busy, setBusy] = useState(false);

  // ✅ Fix invisible typing issue: force readable input styles
  const inputClass =
    "mt-2 w-full rounded-md border border-gray-300 bg-white text-gray-900 " +
    "placeholder-gray-400 px-4 py-3 text-sm outline-none " +
    "focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]";

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerify(false);
    setBusy(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, captchaToken, next }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(json.message || "Login failed.");
        if (res.status === 403 && json.code === "EMAIL_NOT_VERIFIED") {
          setNeedsVerify(true);
        }
        return;
      }

      router.push(next);
    } catch (e: any) {
      setError(e?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setError(null);
    setBusy(true);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || "Failed to resend verification email.");

      setError(json.message || "Verification email sent.");
    } catch (e: any) {
      setError(e?.message || "Failed to resend verification email.");
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
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Complete your application
                </h1>
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-700">
                Log in to finish your application and move closer to your next goal —
                whether that’s{" "}
                <span className="font-semibold text-gray-900">university progression</span>{" "}
                or <span className="font-semibold text-gray-900">career growth</span>.
              </p>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl border border-red-100 bg-white/70 p-5">
                  <p className="text-sm font-semibold text-gray-900">Apply in minutes</p>
                  <ul className="mt-2 space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[color:var(--color-brand)]">
                        1
                      </span>
                      Choose your course and complete your details.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[color:var(--color-brand)]">
                        2
                      </span>
                      Upload documents if needed (optional).
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[color:var(--color-brand)]">
                        3
                      </span>
                      Submit and we’ll guide you on the next steps.
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-red-100 bg-white/70 p-5">
                  <p className="text-sm font-semibold text-gray-900">
                    Need help choosing the right pathway?
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    Tell us your background and goals, we’ll recommend the best route for you.
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
                Your details are handled securely. You can save progress and return anytime.
              </p>
            </div>
          </div>

          {/* Right: form card */}
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-gray-900">Login</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Use your email and password to continue.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
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
                    placeholder="Your password"
                    autoComplete="current-password"
                  />
                </div>

                {/* ✅ Forgot password link */}
                <div className="flex items-center justify-end">
                  <Link
                    href={`/forgot-password?email=${encodeURIComponent(
                      email || emailPrefill
                    )}&next=${encodeURIComponent(next)}`}
                    className="text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
                  >
                    Forgot password?
                  </Link>
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
                  {busy ? "Signing in…" : "Login"}
                </button>

                {needsVerify && (
                  <button
                    type="button"
                    onClick={resendVerification}
                    disabled={busy || !email || !captchaToken}
                    className="w-full rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Resend verification email
                  </button>
                )}

                <p className="text-sm text-gray-600">
                  New here?{" "}
                  <Link
                    className="font-semibold text-[color:var(--color-brand)] hover:underline"
                    href={`/register?next=${encodeURIComponent(next)}`}
                  >
                    Create an account
                  </Link>
                </p>
              </form>

              <div className="mt-6 text-xs text-gray-500">
                By logging in, you agree to our{" "}
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

            {/* Mobile-only encouragement */}
            <div className="mt-6 rounded-2xl border border-red-100 bg-white/70 p-5 lg:hidden">
              <p className="text-sm font-semibold text-gray-900">
                Complete your application
              </p>
              <p className="mt-1 text-sm text-gray-700">
                Log in to finish your application — we’ll guide you on the next steps.
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
