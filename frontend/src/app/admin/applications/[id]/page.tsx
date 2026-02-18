// frontend/src/app/admin/applications/[id]/page.tsx
import Link from "next/link";
import StatusUpdater from "./status-updater";
import { prisma } from "@/lib/prisma";
import { requireAdminPage } from "@/lib/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
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

export default async function AdminApplicationDetailPage({ params }: PageProps) {
  const gate = await requireAdminPage();
  if (!gate.ok) return null;

  const { id } = await params;
  const safeId = String(id || "").trim();

  if (!safeId) {
    return <p className="p-6 text-sm text-gray-600">Missing application id.</p>;
  }

  const app = await prisma.application.findUnique({
    where: { id: safeId },
    include: {
      attachments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const initialStatus = String(app?.status || "SUBMITTED").toUpperCase();

  return (
    <main className="bg-white">
      <section className="rounded-2xl border border-gray-200 bg-[color:var(--color-brand-soft)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Application</h1>
            <p className="mt-1 text-sm text-gray-700">
              {app
                ? `${app.appRef} — ${humanStatus(app.status)}`
                : "Application not found."}
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

      {!app && (
        <section className="p-6">
          <p className="text-sm text-gray-600">
            No data found. Please refresh or check the ID.
          </p>
        </section>
      )}

      {app && (
        <section className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
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
            </div>

            <div className="space-y-6">
              <StatusUpdater
                id={safeId}
                disabled={!app}
                initialStatus={initialStatus}
                options={STATUS_OPTIONS}
              />

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold text-gray-500">ATTACHMENTS</p>

                {app.attachments.length === 0 && (
                  <p className="mt-3 text-sm text-gray-600">No files uploaded.</p>
                )}

                {app.attachments.map((f) => (
                  <div
                    key={f.id}
                    className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {f.fileName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {prettyBytes(f.sizeBytes)} • {f.mimeType}
                      </p>
                    </div>

                    <a
                      className="shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-50"
                      href={`/api/admin/applications/${encodeURIComponent(
                        safeId
                      )}/attachments/${encodeURIComponent(f.id)}/download`}
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
        </section>
      )}
    </main>
  );
}
