// frontend/src/app/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  const whatsappNumber = "+447778208546";
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hi CourseDig — I’d like guidance on the best course pathway for me."
  )}`;

  return (
    <footer className="border-t-4 border-[color:var(--color-brand)] bg-[#FFF5F5]">
      {/* ✅ Contact CTA strip (above the main footer) */}
      <div className="bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm md:p-10">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <p className="inline-flex items-center rounded-full bg-[color:var(--color-brand-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--color-brand)]">
                  Need help choosing a course?
                </p>
                <h3 className="mt-3 text-2xl font-bold text-gray-900">Connect with us now</h3>
                <p className="mt-2 text-sm leading-6 text-gray-700">
                  Get guidance on the best pathway, progression routes, and what to do next.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-6 py-3 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
                >
                  Chat on WhatsApp
                </a>
                <Link
                  href="/enquiry"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Send an enquiry
                </Link>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              We don’t display personal phone numbers publicly. WhatsApp connects you directly to admissions support.
            </p>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              <Link href="/" className="hover:opacity-80">
                CourseDig
              </Link>
            </h3>

            <p className="mt-3 max-w-xs text-sm leading-6 text-gray-700">
              Flexible, career focused programmes designed to support university progression and real world outcomes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Quick links</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/courses" className="hover:text-[color:var(--color-brand)] hover:underline">
                  All courses
                </Link>
              </li>

              <li>
                <Link href="/tuition-fees" className="hover:text-[color:var(--color-brand)] hover:underline">
                  Tuition fees
                </Link>
              </li>

              <li>
                <Link href="/apply" className="hover:text-[color:var(--color-brand)] hover:underline">
                  Apply
                </Link>
              </li>
              <li>
                <Link href="/scholarships" className="hover:text-[color:var(--color-brand)] hover:underline">
                  Scholarships
                </Link>
              </li>
              <li>
                <Link href="/enquiry" className="hover:text-[color:var(--color-brand)] hover:underline">
                  Enquiry
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-[color:var(--color-brand)] hover:underline">
                  Login / Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li>
                <Link href="/about" className="hover:text-[color:var(--color-brand)] hover:underline">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[color:var(--color-brand)] hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[color:var(--color-brand)] hover:underline">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-[color:var(--color-brand)] hover:underline">
                  Terms &amp; conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Get guidance</h4>

            <p className="mt-4 text-sm leading-6 text-gray-700">
              Not sure which course is right for you? Our admissions team can guide you.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-[color:var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              >
                Chat on WhatsApp →
              </a>

              <Link
                href="/enquiry"
                className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Send an enquiry →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom strip */}
      <div className="border-t border-red-700/30 bg-[color:var(--color-brand)]">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-2 text-xs text-white/90 md:flex-row md:items-center md:justify-between">
            <p>
              © 2026 CourseDig. All rights reserved. CourseDig is a trading name of Murab Limited, registered in the
              United Kingdom.
            </p>

            <p className="text-white/70">
              Education pathways <span className="mx-1">•</span>
              Career progression <span className="mx-1">•</span>
              Flexible learning
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
