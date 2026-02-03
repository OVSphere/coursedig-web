"use client";
import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();

      if (json.status === "already_subscribed") setMsg("You’re already subscribed.");
      else if (json.status === "subscribed") setMsg("Subscribed successfully. Thanks!");
      else setMsg("Something went wrong.");
    } catch {
      setMsg("Unable to subscribe right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="text-sm font-medium">Subscribe to our newsletter</label>
      <div className="flex gap-2">
        <input
          className="w-full border rounded p-2"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          disabled={loading || !email.includes("@")}
          className={`px-4 py-2 rounded text-white ${loading ? "bg-gray-600" : "bg-black hover:bg-gray-800"}`}
        >
          {loading ? "..." : "Subscribe"}
        </button>
      </div>
      {msg && <p className="text-sm opacity-80">{msg}</p>}
    </form>
  );
}
