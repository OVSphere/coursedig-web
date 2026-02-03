export default function TermsPage() {
  return (
    <main>
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">Terms</h1>
          <p className="mt-2 text-sm text-gray-700">
            The basic terms for using CourseDig services.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-10 space-y-6 text-gray-800">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 text-sm leading-6">
            <p>
              By using CourseDig, you agree to provide accurate information when submitting enquiries and applications.
            </p>

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-gray-900">Applications</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Applications are reviewed before any decision is made.</li>
                <li>Submitting an application does not guarantee acceptance.</li>
                <li>We may contact you to request clarification or additional documents.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-gray-900">Acceptable use</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Do not upload harmful, illegal, or misleading content.</li>
                <li>Do not attempt to misuse, scrape, or disrupt the platform.</li>
              </ul>
            </div>

            <p className="text-xs text-gray-500">
              This is an MVP terms summary. You can expand it later with liability, governing law, and dispute handling.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
