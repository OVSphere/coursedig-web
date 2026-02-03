export default function PrivacyPage() {
  return (
    <main>
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">Privacy</h1>
          <p className="mt-2 text-sm text-gray-700">
            How we handle your personal data when you use CourseDig.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-10 space-y-6 text-gray-800">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4 text-sm leading-6">
            <p>
              We collect only the information needed to process enquiries and applications, communicate with you,
              and improve our services.
            </p>

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-gray-900">What we collect</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>Contact details (name, email, phone)</li>
                <li>Application details (course choice, statement, supporting files)</li>
                <li>Basic technical data (for security and performance)</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-semibold text-gray-900">How we use it</h2>
              <ul className="list-disc pl-5 text-gray-700">
                <li>To respond to enquiries and process applications</li>
                <li>To send transactional emails (e.g., confirmations)</li>
                <li>To maintain site security and prevent abuse</li>
              </ul>
            </div>

            <p className="text-xs text-gray-500">
               
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
