import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  return `${user.slice(0, 2)}***@${domain}`;
}

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams?: { q?: string };
}) {
  const q = (searchParams?.q || "").trim();

  const enquiries = await prisma.enquiry.findMany({
    where: q
      ? {
          OR: [
            { enquiryRef: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin — Enquiries</h1>
          <p className="text-sm text-gray-400">
            Showing {enquiries.length} most recent enquiries
          </p>
        </div>

        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search ref, name, email…"
            className="w-full sm:w-80 border border-gray-700 bg-black/30 rounded px-3 py-2"
          />
          <button className="px-4 py-2 rounded bg-white text-black font-medium">
            Search
          </button>
        </form>
      </div>

      <div className="border border-gray-800 rounded overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs uppercase tracking-wide text-gray-400 border-b border-gray-800">
          <div className="col-span-3">Ref</div>
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-3">Created</div>
        </div>

        {enquiries.length === 0 ? (
          <div className="p-6 text-gray-400">No enquiries found.</div>
        ) : (
          enquiries.map((e) => (
            <details
              key={e.id}
              className="border-b border-gray-900 px-4 py-3"
            >
              <summary className="grid grid-cols-12 gap-2 cursor-pointer">
                <div className="col-span-3 font-mono text-sm">{e.enquiryRef}</div>
                <div className="col-span-3">{e.fullName}</div>
                <div className="col-span-3 text-gray-300">{maskEmail(e.email)}</div>
                <div className="col-span-3 text-gray-400 text-sm">
                  {new Date(e.createdAt).toLocaleString()}
                </div>
              </summary>

              <div className="mt-3 p-3 rounded bg-white/5">
                <div className="text-sm text-gray-300">
                  <div><span className="text-gray-500">Email:</span> {e.email}</div>
                  <div><span className="text-gray-500">Phone:</span> {e.phone || "-"}</div>
                </div>
                <div className="mt-3">
                  <div className="text-gray-500 text-xs uppercase">Message</div>
                  <pre className="whitespace-pre-wrap text-sm mt-1">{e.message}</pre>
                </div>
              </div>
            </details>
          ))
        )}
      </div>
    </main>
  );
}
