// frontend/src/app/verify-email/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Status = "loading" | "ok" | "error";

export default function VerifyEmailPage() {
  const sp = useSearchParams();

  const token = useMemo(() => sp.get("token") || "", [sp]);
  const next = useMemo(() => sp.get("next") || "/apply", [sp]);

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        setStatus("error");
        setMessage("Missing verification token.");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const json = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (!res.ok) {
          // Invalid/expired stays error (no redirect)
          setStatus("error");
          setMessage(
            json?.message || "This verification link is invalid or has expired."
          );
          return;
        }

        // ✅ Success: includes "already verified" OR verified now
        setStatus("ok");
        setMessage(
          json?.alreadyVerified
            ? "Your email is already verified. You can continue to login."
            : "Email verified successfully. You can continue to login."
        );
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Verification failed.");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const boxClass =
    status === "ok"
      ? "border-green-200 bg-green-50 text-green-800"
      : status === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-gray-200 bg-gray-50 text-gray-700";

  return (
    <main className="min-h-[calc(100vh-140px)] bg-[color:var(--color-brand-soft)]">
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Email verification</h1>

          <div className={`mt-4 rounded-xl border p-4 text-sm ${boxClass}`}>
            <p className="font-semibold">
              {status === "loading"
                ? "Please wait…"
                : status === "ok"
                ? "Verified"
                : "Unable to verify"}
            </p>
            <p className="mt-1">{message}</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/login?verified=1&next=${encodeURIComponent(next)}`}
              className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
            >
              Continue to login
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Go to homepage
            </Link>
          </div>

          {status === "error" && (
            <p className="mt-5 text-xs text-gray-500">
              If your link has expired, please log in and use “Resend verification email”.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
