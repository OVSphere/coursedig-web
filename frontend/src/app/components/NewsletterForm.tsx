//frontend/src/app/components/NewsletterForm.tsx
"use client";

import { useMemo, useState } from "react";

function isEmailLike(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

type Status = "idle" | "success" | "info" | "error";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const emailValid = useMemo(() => isEmailLike(email), [email]);

  const disabled = busy || !emailValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setMessage(null);
    setStatus("idle");

    const cleaned = email.trim().toLowerCase();

    if (!isEmailLike(cleaned)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleaned }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 200 && data?.status === "subscribed") {
        setStatus("success");
        setMessage("You’re subscribed — please check your email for confirmation.");
        setEmail("");
        return;
      }

      if (res.status === 409 && data?.status === "already_subscribed") {
        setStatus("info");
        setMessage("You’re already subscribed. Thanks for staying with CourseDig.");
        return;
      }

      setStatus("error");
      setMessage(data?.message || "Subscribe failed. Please try again.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err?.message || "Subscribe failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="text-sm font-medium">Subscribe to our newsletter</label>

      <div className="flex gap-2">
        <input
          className={`w-full rounded border p-2 outline-none ${
            email.length > 0 && !emailValid
              ? "border-red-400 focus:border-red-500"
              : "border-gray-300 focus:border-black"
          }`}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setMessage(null);
            setStatus("idle");
          }}
          inputMode="email"
          autoComplete="email"
        />

        <button
          type="submit"
          disabled={disabled}
          className={`rounded px-4 py-2 text-white ${
            disabled
              ? "cursor-not-allowed bg-gray-500"
              : "bg-black hover:bg-gray-800"
          }`}
        >
          {busy ? "..." : "Subscribe"}
        </button>
      </div>

      {email.length > 0 && !emailValid ? (
        <p className="text-xs text-red-600">Please enter a valid email address.</p>
      ) : (
        <p className="text-xs text-gray-600">
          We’ll only email you about CourseDig updates.
        </p>
      )}

      {message ? (
        <div
          className={[
            "rounded-xl border p-3 text-sm",
            status === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : status === "info"
              ? "border-blue-200 bg-blue-50 text-blue-800"
              : status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-gray-200 bg-gray-50 text-gray-700",
          ].join(" ")}
        >
          {message}
        </div>
      ) : null}
    </form>
  );
}
