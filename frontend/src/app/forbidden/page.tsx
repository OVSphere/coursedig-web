// frontend/src/app/forbidden/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Access denied | CourseDig",
  description: "You do not have permission to view this page.",
};

export default function ForbiddenPage() {
  return (
    <main className="min-h-[70vh] bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-semibold text-gray-700">Access denied</p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            You don’t have permission to view this page
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-700">
            This area is restricted to CourseDig administrators. If you believe
            this is a mistake, please contact support.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
            >
              Back to home
            </Link>

            <Link
              href="/enquiry"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Contact support
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md px-6 py-3 text-sm font-semibold text-[color:var(--color-brand)] hover:underline"
            >
              Sign in with another account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
