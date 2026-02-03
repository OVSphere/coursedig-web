// src/app/verify-email/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => sp.get("token") || "", [sp]);
  const next = useMemo(() => sp.get("next") || "/apply", [sp]);

  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState<string>("Verifying your email…");

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

        if (!res.ok) {
          if (!cancelled) {
            setStatus("error");
            setMessage(json.message || "Verification failed.");
          }
          return;
        }

        if (!cancelled) {
          setStatus("ok");
          setMessage("Email verified successfully. Redirecting you to login…");
        }

        // Give a tiny pause so user sees success message
        setTimeout(() => {
          router.push(`/login?next=${encodeURIComponent(next)}`);
        }, 900);
      } catch (e: any) {
        if (!cancelled) {
          setStatus("error");
          setMessage(e?.message || "Verification failed.");
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token, next, router]);

  return (
    <main className="min-h-[calc(100vh-140px)] bg-[color:var(--color-brand-soft)]">
      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">Email verification</h1>

          <div
            className={`mt-4 rounded-xl border p-4 text-sm ${
              status === "ok"
                ? "border-green-200 bg-green-50 text-green-800"
                : status === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-gray-200 bg-gray-50 text-gray-700"
            }`}
          >
            {message}
          </div>

          {status === "error" && (
            <div className="mt-5 space-y-2 text-sm text-gray-700">
              <p>
                You can request a new verification email from the{" "}
                <Link className="font-semibold text-[color:var(--color-brand)] hover:underline" href={`/login?next=${encodeURIComponent(next)}`}>
                  login page
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
