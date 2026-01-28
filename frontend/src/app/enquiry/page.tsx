'use client';

import { useState } from 'react';

export default function EnquiryPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const isValid =
    fullName.trim() !== '' &&
    email.includes('@') &&
    message.trim() !== '';

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isValid) return;

    // Backend will be added later
    console.log({ fullName, email, phone, message });

    setSubmitted(true);
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Course Enquiry</h1>

      {submitted ? (
        <div className="bg-green-900/20 border border-green-700 text-green-300 p-4 rounded">
          Thank you — your enquiry has been received.
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

          <button
            type="submit"
            disabled={!isValid}
            className={`px-6 py-2 rounded text-white ${
              isValid
                ? 'bg-black hover:bg-gray-800'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            Submit Enquiry
          </button>
        </form>
      )}
    </main>
  );
}
