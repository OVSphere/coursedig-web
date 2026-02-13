// frontend/src/app/admin/applications/[id]/page.tsx

import Link from "next/link";
import StatusUpdater from "./status-updater";

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

type PageProps = {
  params: Promise<{ id: string }>;
};

async function getApplication(id: string): Promise<ApplicationDetail | null> {
  if (!id) return null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/admin/applications/${encodeURIComponent(id)}`,
    { cache: "no-store" }
  ).catch(() => null as any);

  if (!res || !res.ok) return null;

  const json = await res.json().catch(() => ({}));
  return (json?.application as ApplicationDetail) || null;
}

export default async function AdminApplicationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const safeId = String(id || "").trim();

  const app = await getApplication(safeId);
  const initialStatus = String(app?.status || "SUBMITTED").toUpperCase();

  return (
    <main className="bg-white">
      <section className="rounded-2xl border border-gray-200 bg-[color:var(--color-brand-soft)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application</h1>
            <p className="mt-1 text-sm text-gray-700">
              {!safeId
                ? "Missing application id."
                : app
                ? `${app.appRef} — ${humanStatus(app.status)}`
                : "Application not found (or failed to load)."}
            </p>
          </div>

          <Link
            href="/admin/applications"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            ← Back to applications
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main details */}
          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {!safeId && <p className="text-sm text-gray-600">Missing application id.</p>}
            {safeId && !app && (
              <p className="text-sm text-gray-600">
                No data (not found or failed to load). Please refresh or check the ID.
              </p>
            )}

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
            {/* Status (client component) */}
            <StatusUpdater
              id={safeId}
              disabled={!app || !safeId}
              initialStatus={initialStatus}
              options={STATUS_OPTIONS}
            />

            {/* Attachments */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">ATTACHMENTS</p>
              <p className="mt-1 text-xs text-gray-500">Download uploaded files (Admin + Super Admin).</p>

              <div className="mt-3 space-y-2">
                {!app && safeId && <p className="text-sm text-gray-600">—</p>}
                {!safeId && <p className="text-sm text-gray-600">Missing application id.</p>}

                {app && app.attachments?.length === 0 && (
                  <p className="text-sm text-gray-600">No files uploaded.</p>
                )}

                {app &&
                  app.attachments?.map((f) => (
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
