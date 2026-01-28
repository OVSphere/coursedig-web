'use client';

import { useState } from 'react';

export default function EnquiryPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [enquiryRef, setEnquiryRef] = useState<string | null>(null);

  const isValid =
    fullName.trim() !== '' &&
    email.includes('@') &&
    message.trim() !== '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (!isValid) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, phone, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data?.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setEnquiryRef(data.enquiryRef);
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Course Enquiry</h1>

      {enquiryRef ? (
        <div className="bg-green-900/20 border border-green-700 text-green-300 p-4 rounded space-y-2">
          <p className="font-medium">Thank you - your enquiry has been received.</p>
          <p>
            Your reference:{' '}
            <span className="font-mono font-semibold">{enquiryRef}</span>
          </p>
          <p className="text-sm opacity-90">
            We will respond by email as soon as possible.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="+44 7xxx xxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border rounded p-2"
              rows={4}
              placeholder="Tell us what you’d like to know"
              required
            />
          </div>

          {submitError && (
            <div className="bg-red-900/20 border border-red-700 text-red-300 p-3 rounded">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`px-6 py-2 rounded text-white ${
              isValid && !isSubmitting
                ? 'bg-black hover:bg-gray-800'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Enquiry'}
          </button>
        </form>
      )}
    </main>
  );
}
