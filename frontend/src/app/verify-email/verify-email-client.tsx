// frontend/src/app/verify-email/verify-email-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type Status = "loading" | "ok" | "error";

// Marks a "recent verification succeeded" state (so a refresh without token stays friendly)
const LAST_OK_KEY = "cd:verify-email:lastOk";

function safeGetSession(key: string) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetSession(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemoveSession(key: string) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export default function VerifyEmailClient() {
  const sp = useSearchParams();
  const router = useRouter();

  const token = useMemo(() => sp.get("token") || "", [sp]);
  const next = useMemo(() => sp.get("next") || "/apply", [sp]);

  // Token-specific (optional)
  const tokenDoneKey = useMemo(
    () => (token ? `cd:verify-email:done:${token}` : ""),
    [token]
  );

  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("Verifying your email…");
  const [alreadyVerified, setAlreadyVerified] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // ✅ If token missing but we *recently verified*, show success + login
      if (!token) {
        const recentOk = safeGetSession(LAST_OK_KEY) === "1";
        if (recentOk) {
          setStatus("ok");
          setAlreadyVerified(false);
          setMessage("Email verified successfully. You can continue to login.");
          return;
        }

        setStatus("error");
        setMessage("Missing verification token. Please open the link from your email again.");
        return;
      }

      // ✅ If we already handled this token in this session, don't call API again
      if (tokenDoneKey && safeGetSession(tokenDoneKey) === "ok") {
        setStatus("ok");
        setAlreadyVerified(false);
        setMessage("Email verified successfully. You can continue to login.");

        // clean URL once (remove token), keeps next
        const cleanUrl = `/verify-email?next=${encodeURIComponent(next)}`;
        router.replace(cleanUrl);
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
          const code = String(json?.code || "");
          const looksLikeAlreadyUsed = code === "TOKEN_INVALID" || code === "TOKEN_EXPIRED";

          // If token is already used/expired, user might have verified already.
          // Show a friendly "continue" state + login button.
          if (looksLikeAlreadyUsed) {
            setStatus("ok");
            setAlreadyVerified(true);
            setMessage(
              "This link has already been used. If you’ve verified your email, you can continue to login."
            );

            // keep URL clean and avoid repeated calls on refresh
            safeSetSession(LAST_OK_KEY, "1");
            router.replace(`/verify-email?next=${encodeURIComponent(next)}`);
            return;
          }

          setStatus("error");
          setMessage(json?.message || "This verification link is invalid or has expired.");
          // keep token in URL for real errors (no replace)
          return;
        }

        // ✅ Success (includes alreadyVerified)
        const isAlready = Boolean(json?.alreadyVerified);
        setStatus("ok");
        setAlreadyVerified(isAlready);
        setMessage(
          isAlready
            ? "Your email is already verified. You can continue to login."
            : "Email verified successfully. You can continue to login."
        );

        // Mark success so refreshes without token remain friendly
        safeSetSession(LAST_OK_KEY, "1");
        if (tokenDoneKey) safeSetSession(tokenDoneKey, "ok");

        // ✅ Clean the URL once (removes token so refresh won’t re-verify)
        router.replace(`/verify-email?next=${encodeURIComponent(next)}`);
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
  }, [token, next, router, tokenDoneKey]);

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
                ? alreadyVerified
                  ? "You can continue"
                  : "Verified"
                : "Unable to verify"}
            </p>
            <p className="mt-1">{message}</p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {status === "ok" ? (
              <Link
                href={`/login?verified=1&next=${encodeURIComponent(next)}`}
                className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
              >
                Login
              </Link>
            ) : null}

            {status === "error" ? (
              <Link
                href={`/verify-email-gate?next=${encodeURIComponent(next)}`}
                className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
              >
                Resend verification email
              </Link>
            ) : null}

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Go to homepage
            </Link>
          </div>

          {status === "error" ? (
            <p className="mt-5 text-xs text-gray-500">
              If your link has expired, you can request a new one above.
            </p>
          ) : null}

          {status === "ok" ? (
            <button
              type="button"
              onClick={() => safeRemoveSession(LAST_OK_KEY)}
              className="mt-6 text-xs text-gray-500 hover:underline"
            >
              Not you? Clear this device state
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}
