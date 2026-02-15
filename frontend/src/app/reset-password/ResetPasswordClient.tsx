//frontend/src/app/reset-password/ResetPasswordClient.tsx
"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import TurnstileWidget from "@/app/components/TurnstileWidget";

export default function ResetPasswordClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => sp.get("token") || "", [sp]);
  const next = useMemo(() => sp.get("next") || "/apply", [sp]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "mt-2 w-full rounded-md border border-gray-300 bg-white text-gray-900 " +
    "placeholder-gray-400 px-4 py-3 text-sm outline-none " +
    "focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Missing reset token. Please request a new link.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, captchaToken }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || "Password reset failed.");
        return;
      }

      const email = String(json.email ?? "");
      router.push(`/login?next=${encodeURIComponent(next)}&email=${encodeURIComponent(email)}`);
    } catch (e: any) {
      setError(e?.message || "Password reset failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-140px)] bg-[color:var(--color-brand-soft)]">
      <div className="mx-auto max-w-xl px-6 py-14">
        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Reset password</h1>
          <p className="mt-1 text-sm text-gray-600">Choose a new password for your account.</p>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-900">New password</label>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-900">Confirm password</label>
              <input
                type="password"
                className={inputClass}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
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
              {busy ? "Updating…" : "Update password"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link
                className="font-semibold text-[color:var(--color-brand)] hover:underline"
                href={`/forgot-password?next=${encodeURIComponent(next)}`}
              >
                Request a new link
              </Link>

              <Link className="text-gray-600 hover:underline" href="/login">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
