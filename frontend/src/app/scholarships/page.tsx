import Link from "next/link";

export default function ScholarshipsPage() {
  return (
    <main className="bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">Scholarships</h1>
          <p className="mt-2 text-sm text-gray-700">
            View scholarship information and eligibility. To submit a scholarship application,
            you’ll need to create an account and sign in.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/scholarships/apply"
              className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
            >
              Apply for scholarship
            </Link>
            <Link
              href="/register?next=/scholarships/apply"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Public information (MVP)</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Eligibility overview</li>
              <li>How to apply</li>
              <li>Important dates</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
            <h2 className="text-lg font-semibold text-gray-900">Full scholarship pack</h2>
            <p className="mt-2 text-sm text-gray-700">
              Logged-in users will see detailed scholarship packs, internal guidance,
              and downloadable resources here (Phase 2).
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
