// frontend/src/app/admin/enquiries/page.tsx
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  return `${user.slice(0, 2)}***@${domain}`;
}

function parseTypeFromMessage(message: string) {
  const m = String(message || "");
  const firstLine = m.split("\n")[0] || "";
  const match = firstLine.match(/^\[TYPE\]\s*(.+)\s*$/i);
  return match?.[1]?.trim() || "GENERAL";
}

function humanType(t: string) {
  const v = (t || "GENERAL").toUpperCase();
  if (v === "GENERAL") return "General";
  if (v === "COURSE") return "Course";
  if (v === "SCHOLARSHIP") return "Scholarship";
  if (v === "APPLICATION_PROGRESS") return "Application";
  if (v === "PAYMENTS") return "Payments";
  if (v === "TECH_SUPPORT") return "Tech support";
  if (v === "PARTNERSHIP") return "Partnership";
  return "Other";
}

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const gate = await requireAdmin();

  if (!gate.ok && gate.reason === "UNAUTHENTICATED") {
    redirect("/login?next=/admin/enquiries");
  }
  if (!gate.ok && gate.reason === "FORBIDDEN") {
    redirect("/forbidden");
  }

  const q = (searchParams?.q || "").trim();

  const enquiries = await prisma.enquiry.findMany({
    where: q
      ? {
          OR: [
            { enquiryRef: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { message: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Enquiries</h1>
              <p className="mt-1 text-sm text-gray-700">
                Showing {enquiries.length} most recent enquiries
              </p>
            </div>

            <form className="flex gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder="Search ref, name, email, message…"
                className="w-full sm:w-96 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
              />
              <button className="rounded-md bg-[color:var(--color-brand)] px-4 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]">
                Search
              </button>
            </form>
          </div>

          <div className="mt-4">
            <Link
              href="/"
              className="text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
            >
              ← Back to site
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="grid grid-cols-12 gap-2 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              <div className="col-span-2">Ref</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-3">Email</div>
              <div className="col-span-2">Created</div>
            </div>

            {enquiries.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">No enquiries found.</div>
            ) : (
              enquiries.map((e) => {
                const t = parseTypeFromMessage(e.message);
                return (
                  <details key={e.id} className="border-t border-gray-200 px-4 py-3">
                    <summary className="grid cursor-pointer grid-cols-12 gap-2">
                      <div className="col-span-2 font-mono text-sm text-gray-900">{e.enquiryRef}</div>
                      <div className="col-span-2 text-sm font-semibold text-gray-800">
                        {humanType(t)}
                      </div>
                      <div className="col-span-3 text-gray-900">{e.fullName}</div>
                      <div className="col-span-3 text-gray-700">{maskEmail(e.email)}</div>
                      <div className="col-span-2 text-sm text-gray-600">
                        {new Date(e.createdAt).toLocaleString()}
                      </div>
                    </summary>

                    <div className="mt-3 rounded-xl bg-gray-50 p-4">
                      <div className="text-sm text-gray-700">
                        <div>
                          <span className="font-semibold text-gray-900">Email:</span> {e.email}
                        </div>
                        <div className="mt-1">
                          <span className="font-semibold text-gray-900">Phone:</span> {e.phone || "-"}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Message
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-800">
                          {e.message}
                        </pre>
                      </div>
                    </div>
                  </details>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
