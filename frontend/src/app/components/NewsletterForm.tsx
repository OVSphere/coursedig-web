// frontend/src/app/components/NewsletterForm.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TurnstileWidget from "@/app/components/TurnstileWidget";

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Turnstile
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const emailValid = useMemo(() => isEmailLike(email), [email]);

  // Whether captcha is configured at all
  const captchaConfigured = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  /**
   * ✅ FIX: Only show captcha after user has entered a valid email.
   * This stops “Success” appearing on empty forms and reduces auto-verification noise.
   */
  const shouldShowCaptcha = useMemo(() => {
    if (!captchaConfigured) return false;
    if (loading) return false;
    if (!emailValid) return false;
    return true;
  }, [captchaConfigured, emailValid, loading]);

  /**
   * ✅ FIX: Stable callback so TurnstileWidget doesn't re-render/re-initialise repeatedly.
   */
  const handleCaptchaToken = useCallback((t: string) => {
    setCaptchaToken(t || "");
  }, []);

  /**
   * ✅ Optional safety: if the user changes email, clear captcha token
   * so they must re-verify for the new value.
   */
  useEffect(() => {
    setCaptchaToken("");
    // Don’t constantly re-mount the widget while typing.
    // Only bump captchaKey when we intentionally want a reset (e.g., after submit).
  }, [email]);

  const canSubmit = useMemo(() => {
    if (!emailValid) return false;
    if (captchaConfigured && !captchaToken) return false;
    if (loading) return false;
    return true;
  }, [emailValid, captchaConfigured, captchaToken, loading]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const cleanEmail = email.trim().toLowerCase();

    // HARD STOP: invalid email
    if (!isEmailLike(cleanEmail)) {
      setMsg("Please enter a valid email address.");
      return;
    }

    // HARD STOP: captcha missing (only if configured)
    if (captchaConfigured && !captchaToken) {
      setMsg("Please complete the captcha to continue.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail,
          captchaToken,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (res.status === 409 || json.status === "already_subscribed") {
        setMsg("You’re already subscribed.");
      } else if (res.ok && json.status === "subscribed") {
        setMsg("Subscribed successfully. Thanks!");
        setEmail("");
      } else {
        setMsg(json.message || "Something went wrong.");
      }
    } catch {
      setMsg("Unable to subscribe right now.");
    } finally {
      setLoading(false);

      // ✅ Reset captcha after submit (success OR fail)
      setCaptchaToken("");
      setCaptchaKey((k) => k + 1);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="text-sm font-medium">Subscribe to our newsletter</label>

      <div className="flex gap-2">
        <input
          className={`w-full border rounded p-2 outline-none ${
            email.length > 0 && !emailValid
              ? "border-red-400 focus:border-red-500"
              : "border-gray-300 focus:border-black"
          }`}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputMode="email"
          autoComplete="email"
          disabled={loading}
        />

        <button
          type="submit"
          disabled={!canSubmit}
          className={`px-4 py-2 rounded text-white ${
            !canSubmit
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-black hover:bg-gray-800"
          }`}
        >
          {loading ? "..." : "Subscribe"}
        </button>
      </div>

      {/* Inline email validation */}
      {email.length > 0 && !emailValid && (
        <p className="text-xs text-red-600">
          Please enter a valid email address.
        </p>
      )}

      {/* ✅ Cloudflare Turnstile only after valid email */}
      {shouldShowCaptcha && (
        <div className="pt-2">
          <TurnstileWidget
            key={captchaKey}
            onToken={handleCaptchaToken}
            theme="light"
          />
        </div>
      )}

      {/* If captcha is configured and email is valid, but token not yet present */}
      {captchaConfigured && emailValid && !captchaToken && !loading && (
        <p className="text-xs text-gray-600">
          Please complete the security check to subscribe.
        </p>
      )}

      {msg && <p className="text-sm opacity-80">{msg}</p>}
    </form>
  );
}
