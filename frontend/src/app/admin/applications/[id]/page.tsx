// frontend/src/app/admin/applications/[id]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Attachment = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  s3Key?: string | null;
  createdAt?: string | Date | null;
};

type ApplicationDetail = {
  id: string;
  appRef: string;
  applicationType: "COURSE" | "SCHOLARSHIP" | string;
  status: string;
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

const STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "OFFER_MADE", label: "Offer made (Course final)" },
  { value: "GRANTED", label: "Granted (Scholarship final)" },
];

export default function AdminApplicationDetailPage(props: { params: { id: string } }) {
  const id = useMemo(() => String(props?.params?.id || "").trim(), [props?.params?.id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [status, setStatus] = useState("SUBMITTED");

  async function load() {
    if (!id) {
      setMsg("Missing application id.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/applications/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to load application.");

      const a = json?.application as ApplicationDetail;
      setApp(a);
      setStatus(String(a?.status || "SUBMITTED").toUpperCase());
    } catch (e: any) {
      setMsg(e?.message || "Failed to load application.");
      setApp(null);
    } finally {
      setLoading(false);
    }
  }

  async function saveStatus() {
    if (!id) return;
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/applications/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to update status.");

      // Update local state
      setApp((prev) => (prev ? { ...prev, status } : prev));
    } catch (e: any) {
      setMsg(e?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <main className="bg-white">
      <section className="rounded-2xl border border-gray-200 bg-[color:var(--color-brand-soft)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application</h1>
            <p className="mt-1 text-sm text-gray-700">
              {loading ? "Loading…" : app ? `${app.appRef} — ${humanStatus(app.status)}` : "—"}
            </p>
          </div>

          <Link
            href="/admin/applications"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            ← Back to applications
          </Link>
        </div>

        {msg && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900">
            {msg}
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main details */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {!app && !loading && <p className="text-sm text-gray-600">No data.</p>}
            {loading && <p className="text-sm text-gray-600">Loading…</p>}

            {app && (
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Applicant</p>
                    <p className="text-sm text-gray-900">
                      {app.firstName} {app.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Email</p>
                    <p className="text-sm text-gray-900">{app.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Phone</p>
                    <p className="text-sm text-gray-900">{app.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Country</p>
                    <p className="text-sm text-gray-900">{app.countryOfResidence}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Type</p>
                    <p className="text-sm text-gray-900">{app.applicationType}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">Submitted</p>
                    <p className="text-sm text-gray-900">{formatDate(app.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500">Course</p>
                  <p className="text-sm text-gray-900">
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

          {/* Right rail */}
          <div className="space-y-6">
            {/* Status */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">UPDATE STATUS</p>

              <div className="mt-3 flex items-center gap-2">
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={saveStatus}
                  disabled={saving || !app}
                  className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                    saving || !app ? "bg-gray-400" : "bg-[color:var(--color-brand)] hover:opacity-95"
                  }`}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Tip: “Offer made” is final for Course applications; “Granted” is final for Scholarship.
              </p>
            </div>

            {/* Attachments */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">ATTACHMENTS</p>
              <p className="mt-1 text-xs text-gray-500">Download uploaded files (Admin + Super Admin).</p>

              <div className="mt-3 space-y-2">
                {!app && !loading && <p className="text-sm text-gray-600">—</p>}
                {loading && <p className="text-sm text-gray-600">Loading…</p>}

                {app && app.attachments?.length === 0 && (
                  <p className="text-sm text-gray-600">No files uploaded.</p>
                )}

                {app && app.attachments?.map((f) => (
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

                    <a
                      className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                      href={`/api/admin/attachments/${encodeURIComponent(f.id)}/download`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
