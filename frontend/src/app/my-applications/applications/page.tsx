// frontend/src/app/my-applications/applications/page.tsx
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
    hour: "2-digit",
    minute: "2-digit",
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

export default function MyApplicationsPage() {
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
    <main className="bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My applications</h1>
              <p className="mt-1 text-sm text-gray-700">View all submitted applications and progress.</p>
            </div>

            <Link
              href="/profile"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              ← Back to profile
            </Link>
          </div>

          {msg ? (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900">
              {msg}{" "}
              {msg.toLowerCase().includes("sign in") ? (
                <Link
                  href="/login?next=/my-applications/applications"
                  className="ml-2 font-semibold text-[color:var(--color-brand)] hover:underline"
                >
                  Login →
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {loading ? (
              <p className="text-sm text-gray-600">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-600">
                No applications found.{" "}
                <Link href="/apply" className="font-semibold text-[color:var(--color-brand)] hover:underline">
                  Apply now →
                </Link>
              </p>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-xs uppercase tracking-wide text-gray-500 border-b">
                    <tr>
                      <th className="py-3 pr-4">Reference</th>
                      <th className="py-3 pr-4">Course</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Submitted</th>
                      <th className="py-3 pr-0">Action</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {items.map((a) => (
                      <tr key={a.id} className="text-gray-800">
                        <td className="py-3 pr-4 font-mono font-semibold text-gray-900">{a.appRef}</td>
                        <td className="py-3 pr-4">{a.courseName || "—"}</td>
                        <td className="py-3 pr-4">{humanStatus(a.status)}</td>
                        <td className="py-3 pr-4">{formatDate(a.createdAt)}</td>
                        <td className="py-3 pr-0">
                          <Link
                            href={`/my-applications/applications/${a.id}`}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
