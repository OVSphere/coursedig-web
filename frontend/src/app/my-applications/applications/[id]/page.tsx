// frontend/src/app/my-applications/applications/[id]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Attachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt?: string | Date | null;
};

type ApplicationDetail = {
  id: string;
  appRef: string;
  applicationType?: string | null;
  status?: string | null;
  createdAt: string | Date;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryOfResidence: string;

  courseName: string;
  otherCourseName?: string | null;

  personalStatement: string;

  attachments: Attachment[];
};

function formatDate(d: any) {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString();
}

function prettyBytes(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function humanStatus(s?: string | null) {
  const v = (s || "SUBMITTED").toUpperCase();
  if (v === "SUBMITTED") return "Submitted";
  if (v === "IN_PROGRESS") return "In progress";
  if (v === "OFFER_MADE") return "Offer made";
  if (v === "GRANTED") return "Granted";
  return s || "Submitted";
}

export default function MyApplicationDetailPage(props: { params: { id: string } }) {
  const id = useMemo(() => String(props?.params?.id || "").trim(), [props?.params?.id]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [app, setApp] = useState<ApplicationDetail | null>(null);

  async function load() {
    if (!id) {
      setMsg("Missing application id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/applications/my/${encodeURIComponent(id)}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));

      if (res.status === 401) {
        setMsg("Please sign in to view this application.");
        setApp(null);
        return;
      }

      if (!res.ok) throw new Error(json?.message || "Failed to load application.");

      setApp(json?.application || null);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load application.");
      setApp(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <main className="bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My application</h1>
              <p className="mt-1 text-sm text-gray-700">
                {loading ? "Loading…" : app ? `${app.appRef} — ${humanStatus(app.status)}` : "—"}
              </p>
            </div>

            <Link
              href="/my-applications/applications"
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              ← Back to my applications
            </Link>
          </div>

          {msg ? (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900">
              {msg}{" "}
              {msg.toLowerCase().includes("sign in") ? (
                <Link
                  href={`/login?next=/my-applications/applications/${encodeURIComponent(id)}`}
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
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              {!app && !loading && <p className="text-sm text-gray-600">No data.</p>}
              {loading && <p className="text-sm text-gray-600">Loading…</p>}

              {app && (
                <div className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Reference</p>
                      <p className="mt-1 font-mono text-sm font-semibold text-gray-900">{app.appRef}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Status</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{humanStatus(app.status)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Submitted</p>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(app.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500">Type</p>
                      <p className="mt-1 text-sm text-gray-900">{app.applicationType || "—"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">Course</p>
                    <p className="mt-1 text-sm text-gray-900">
                      {app.courseName}
                      {app.otherCourseName ? ` (Other: ${app.otherCourseName})` : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500">Personal statement</p>
                    <div className="mt-2 whitespace-pre-wrap rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-900">
                      {app.personalStatement || "—"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">ATTACHMENTS</p>
              <p className="mt-1 text-xs text-gray-500">For your reference. (Downloads not enabled here yet.)</p>

              <div className="mt-3 space-y-2">
                {!app && !loading ? <p className="text-sm text-gray-600">—</p> : null}
                {loading ? <p className="text-sm text-gray-600">Loading…</p> : null}

                {app && app.attachments?.length === 0 ? (
                  <p className="text-sm text-gray-600">No files uploaded.</p>
                ) : null}

                {app?.attachments?.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{f.fileName}</p>
                      <p className="text-xs text-gray-600">
                        {prettyBytes(f.sizeBytes)} • {f.mimeType}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600">
                      Saved
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-gray-500">
                If you need a file copy, use <Link href="/enquiry" className="font-semibold text-[color:var(--color-brand)] hover:underline">Enquiry</Link>{" "}
                and include your application reference.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
