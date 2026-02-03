// src/app/scholarships/page.tsx
import Link from "next/link";

export default function ScholarshipsPage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            {/* Left: marketing / motivation */}
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Scholarships that help you move forward
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-gray-700">
                If cost is a barrier, don’t let it stop you. Apply for a CourseDig scholarship
                and tell us what you want to achieve — we’ll guide you through the next steps.
              </p>

              {/* Motivation highlight */}
              <div className="mt-6 rounded-2xl border border-red-100 bg-white/70 p-5">
                <p className="text-sm font-semibold text-gray-900">
                  A quick note before you start
                </p>
                <p className="mt-2 text-sm text-gray-700">
                  You don’t need perfect writing. What matters is clarity and honesty —
                  your goals, your situation, and why support would help.
                </p>
              </div>

              {/* CTAs */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {/* ✅ DO NOT link directly to /scholarships/apply */}
                <Link
                  href="/login?next=/scholarships/apply"
                  className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--color-brand-dark)]"
                >
                  Apply for scholarship
                </Link>

                <Link
                  href="/register?next=/scholarships/apply"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
                >
                  Create account
                </Link>
              </div>

              <p className="mt-5 text-xs text-gray-500">
                You’ll need an account to submit a scholarship application.
              </p>
            </div>

            {/* Right: guidance cards */}
            <div className="grid gap-4">
              {/* How it works */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">How it works</h2>
                <ol className="mt-4 space-y-3 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-xs font-bold text-[color:var(--color-brand)]">
                      1
                    </span>
                    <span>Create an account (takes about a minute).</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-xs font-bold text-[color:var(--color-brand)]">
                      2
                    </span>
                    <span>Complete the scholarship form and submit.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-xs font-bold text-[color:var(--color-brand)]">
                      3
                    </span>
                    <span>We review and contact you with the next steps.</span>
                  </li>
                </ol>

                <p className="mt-4 text-xs text-gray-500">
                  No long paperwork at this stage, just the essentials.
                </p>
              </div>

              {/* Who it's for */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Who it’s for</h2>
                <p className="mt-2 text-sm text-gray-700">
                  Scholarships are typically aimed at learners who show motivation, need, and
                  commitment to progress.
                </p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  <li>Progressing into university or professional qualifications</li>
                  <li>Changing career path or improving employability</li>
                  <li>Returning to learning after a break</li>
                </ul>
                <p className="mt-3 text-xs text-gray-500">
                  If you’re unsure, you can still apply — we’ll advise you on what’s needed.
                </p>
              </div>

              {/* What you'll need */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">What you’ll need</h2>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  <li>Basic personal details</li>
                  <li>A short personal statement (your goals + why support helps)</li>
                  <li>Optional documents (only if requested)</li>
                </ul>
                <p className="mt-3 text-xs text-gray-500">You can save and return anytime.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* INFO + SUPPORT */}
      <section>
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Review time / communication */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900">
                What happens after you apply
              </h2>
              <p className="mt-2 text-sm text-gray-700">
                We aim to review scholarship applications within{" "}
                <span className="font-semibold text-gray-900">5 working days</span>, but it may take
                longer during peak periods.
              </p>
              <p className="mt-3 text-sm text-gray-700">
                If you don’t hear from us after 5 working days, please{" "}
                <Link
                  href="/enquiry"
                  className="font-semibold text-[color:var(--color-brand)] hover:underline"
                >
                  send an enquiry
                </Link>{" "}
                or email us to request an update on your application.
              </p>

              <div className="mt-4 rounded-2xl border border-red-100 bg-[color:var(--color-brand-soft)] p-4">
                <p className="text-sm font-semibold text-gray-900">Tip</p>
                <p className="mt-1 text-sm text-gray-700">
                  Keep your statement simple: your goal, your current situation, and what support
                  would change for you.
                </p>
              </div>
            </div>

            {/* Help box */}
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Need help?</h2>
              <p className="mt-2 text-sm text-gray-700">
                Not sure what to write or which course fits your goals? Tell us your background and
                we’ll guide you.
              </p>
              <Link
                href="/enquiry"
                className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Get free guidance →
              </Link>

              <p className="mt-4 text-xs text-gray-500">
                We respond as quickly as possible, especially for time sensitive enquiries.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
