import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t-4 border-[color:var(--color-brand)] bg-[#FFF5F5]">
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
              Flexible, career-focused programmes designed to support
              university progression and real-world outcomes.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Quick links</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li><Link href="/courses" className="hover:text-[color:var(--color-brand)] hover:underline">All courses</Link></li>
              <li><Link href="/apply" className="hover:text-[color:var(--color-brand)] hover:underline">Apply</Link></li>
              <li><Link href="/scholarships" className="hover:text-[color:var(--color-brand)] hover:underline">Scholarships</Link></li>
              <li><Link href="/enquiry" className="hover:text-[color:var(--color-brand)] hover:underline">Enquiry</Link></li>
              <li><Link href="/login" className="hover:text-[color:var(--color-brand)] hover:underline">Login / Register</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              <li><Link href="/about" className="hover:text-[color:var(--color-brand)] hover:underline">About us</Link></li>
              <li><Link href="/contact" className="hover:text-[color:var(--color-brand)] hover:underline">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-[color:var(--color-brand)] hover:underline">Privacy policy</Link></li>
              <li><Link href="/terms" className="hover:text-[color:var(--color-brand)] hover:underline">Terms &amp; conditions</Link></li>
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Get guidance
            </h4>

            <p className="mt-4 text-sm leading-6 text-gray-700">
              Not sure which course is right for you?  
              Our admissions team can guide you.
            </p>

            <Link
              href="/enquiry"
              className="mt-5 inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Send an enquiry →
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom strip (brand red, legal + trust) */}
      <div className="border-t border-red-700/30 bg-[color:var(--color-brand)]">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-2 text-xs text-white/90 md:flex-row md:items-center md:justify-between">
            <p>
              © 2026 CourseDig. All rights reserved. CourseDig is a trading name of
              Murab Limited, registered in the United Kingdom.
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
