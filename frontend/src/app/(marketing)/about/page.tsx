import Link from "next/link";

export default function AboutPage() {
  return (
    <main>
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">About CourseDig</h1>
          <p className="mt-2 text-sm text-gray-700">
            CourseDig helps learners find the right programme and apply with confidence.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-10 space-y-6 text-gray-800">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <p>
              We provide clear course information, straightforward applications, and quick support when you need it.
            </p>
            <p>
              Our goal is simple: make it easier to start the right learning journey — whether you’re building skills,
              preparing for university entry, or applying for advanced pathways.
            </p>

            <div className="pt-2">
              <Link
                href="/courses"
                className="inline-flex rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
              >
                Browse courses
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
