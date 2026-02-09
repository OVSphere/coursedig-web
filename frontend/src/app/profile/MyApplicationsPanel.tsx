// frontend/src/app/profile/MyApplicationsPanel.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type MyAppRow = {
  id: string;
  appRef: string;
  courseName: string;
  createdAt: string | Date;
  status?: string | null;
};

function formatDate(d: any) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function humanStatus(s?: string | null) {
  const v = (s || "SUBMITTED").toUpperCase();
  if (v === "SUBMITTED") return "Submitted";
  if (v === "IN_PROGRESS") return "In progress";
  if (v === "OFFER_MADE") return "Offer made";
  if (v === "GRANTED") return "Granted";
  return s || "Submitted";
}

export default function MyApplicationsPanel() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [items, setItems] = useState<MyAppRow[]>([]);

  async function load() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/applications/my", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setMsg("Please sign in to view your applications.");
        setItems([]);
        return;
      }

      if (!res.ok) throw new Error(json?.message || "Failed to load applications.");

      setItems(Array.isArray(json?.applications) ? json.applications : []);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load applications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">My applications</h2>
          <p className="mt-1 text-sm text-gray-700">Track your submitted applications and progress.</p>
        </div>

        <Link
          href="/my-applications/applications"
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
        >
          View all →
        </Link>
      </div>

      {msg ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900">
          {msg}{" "}
          {msg.toLowerCase().includes("sign in") ? (
            <Link
              href="/login?next=/profile"
              className="ml-2 font-semibold text-[color:var(--color-brand)] hover:underline"
            >
              Login →
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-600">
            No applications yet.{" "}
            <Link href="/apply" className="font-semibold text-[color:var(--color-brand)] hover:underline">
              Apply now →
            </Link>
          </p>
        ) : (
          <div className="divide-y rounded-xl border border-gray-200">
            {items.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold text-gray-900">{a.appRef}</p>
                  <p className="truncate text-sm text-gray-700">{a.courseName}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {humanStatus(a.status)} • {formatDate(a.createdAt)}
                  </p>
                </div>

                <Link
                  href={`/my-applications/applications/${a.id}`}
                  className="shrink-0 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 3 ? (
        <p className="mt-3 text-xs text-gray-500">Showing latest 3. Use “View all” for the full list.</p>
      ) : null}
    </div>
  );
}
