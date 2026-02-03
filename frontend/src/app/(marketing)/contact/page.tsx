import Link from "next/link";

export default function ContactPage() {
  return (
    <main>
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">Contact</h1>
          <p className="mt-2 text-sm text-gray-700">
            If you have questions about our courses, applications, or partnerships, we’re happy to help. Send us a message.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-10 space-y-6 text-gray-800">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <p className="text-sm text-gray-700">
              For the fastest response, use our enquiry form and we’ll reply by email.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/enquiry"
                className="inline-flex justify-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
              >
                Send an enquiry
              </Link>

              <Link
                href="/apply"
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Apply for a course
              </Link>
            </div>

            <div className="pt-2 text-xs text-gray-500">
              We respond as soon as possible during business hours.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
