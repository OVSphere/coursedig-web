"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

type NavItem = { href: string; label: string };

type MeResponse =
  | { user: null }
  | {
      user: {
        id: string;
        email: string;
        fullName: string | null;
        createdAt: string;
        isAdmin: boolean;
      };
    };

const NAV: NavItem[] = [
  { href: "/courses", label: "Courses" },
  { href: "/scholarships", label: "Scholarships" },
  { href: "/enquiry", label: "Enquiry" },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function IconFacebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.6-1.6h1.6V4.8c-.8-.1-1.8-.2-3-.2-2.8 0-4.7 1.7-4.7 4.9V11H6.3v3H9v8h4.5z" />
    </svg>
  );
}

function IconInstagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm9 2h-9A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4zm-4.5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5zm0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5zM17.6 6.2a.9.9 0 1 1-.9.9.9.9 0 0 1 .9-.9z" />
    </svg>
  );
}

function IconX(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.3 2H21l-6.2 7.1L22.5 22h-6.7l-5.2-6.9L4.7 22H2l6.8-7.8L1.5 2h6.8l4.7 6.2L18.3 2zm-1.2 18h1.5L6.9 3.9H5.3L17.1 20z" />
    </svg>
  );
}

function IconWhatsApp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M20.5 3.5A11 11 0 0 0 3.7 17.7L2 22l4.5-1.6A11 11 0 0 0 20.5 3.5zm-8.6 18a9 9 0 0 1-4.6-1.3l-.3-.2-2.6.9.9-2.5-.2-.3A9 9 0 1 1 11.9 21.5zm5.2-6.7c-.3-.2-1.7-.8-2-1s-.5-.2-.7.2-.8 1-.9 1.2-.3.2-.6.1a7.3 7.3 0 0 1-2.1-1.3 7.9 7.9 0 0 1-1.5-1.9c-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5s0-.3 0-.5-.7-1.7-.9-2.3c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.7.3-.2.2-1 1-1 2.5s1 2.9 1.2 3.1c.1.2 2 3.1 4.8 4.3.7.3 1.2.5 1.7.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.1-1.4-.1-.2-.3-.2-.6-.4z" />
    </svg>
  );
}

function IconPhone(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.6 10.8c1.5 3 3.6 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1.1-.3 1.2.4 2.5.6 3.8.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.3 21 3 13.7 3 4c0-.6.4-1 1-1h3.3c.6 0 1 .4 1 1 0 1.3.2 2.6.6 3.8.1.4 0 .8-.3 1.1L6.6 10.8z" />
    </svg>
  );
}

function IconMenu(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z" />
    </svg>
  );
}

function IconClose(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3 1.4 1.4z" />
    </svg>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [me, setMe] = useState<MeResponse>({ user: null });
  const [meLoaded, setMeLoaded] = useState(false);

  const isAuthed = !!me.user;
  const isAdmin = !!me.user?.isAdmin;

  async function loadMe() {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const json = (await res.json()) as MeResponse;
      setMe(json);
    } catch {
      setMe({ user: null });
    } finally {
      setMeLoaded(true);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (cancelled) return;
      await loadMe();
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const activeHref = useMemo(() => pathname ?? "/", [pathname]);

  const telHref = "tel:01613882338";
  const whatsappHref = "https://wa.me/447778208546";

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setMe({ user: null });
      setMobileOpen(false);
      router.push("/");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      {/* Top bar */}
      <div className="border-b border-red-700/30 bg-[color:var(--color-brand)] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-2">
          {/* Left: CTAs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* WhatsApp (green branded) */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold text-[#25D366] shadow-sm hover:bg-white/95"
              title="Chat on WhatsApp"
              aria-label="Chat on WhatsApp"
            >
              <IconWhatsApp className="h-4 w-4" />
              <span>Chat on WhatsApp</span>
            </a>

            <span className="hidden text-white/70 md:inline">•</span>

            <span className="hidden text-white/90 md:inline">
              Quick guidance · fast replies
            </span>

            <span className="hidden text-white/70 md:inline">•</span>

            {/* Call CTA (tel link) */}
            <a
              href={telHref}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-semibold text-[color:var(--color-brand)] shadow-sm hover:bg-white/95"
              title="Call now"
              aria-label="Call now"
            >
              <IconPhone className="h-4 w-4" />
              <span className="hidden sm:inline">Call now</span>
              <span className="sm:hidden">Call</span>
            </a>
          </div>

          {/* Right: Social icons (brand colours) */}
          <div className="flex items-center gap-2">
            <a
              href="https://www.facebook.com/yourcoursedig/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm hover:bg-white/95"
              aria-label="CourseDig on Facebook"
              title="Facebook"
            >
              <IconFacebook className="h-4 w-4 text-[#1877F2]" />
            </a>

            <a
              href="https://www.instagram.com/coursedig/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm hover:bg-white/95"
              aria-label="CourseDig on Instagram"
              title="Instagram"
            >
              <IconInstagram className="h-4 w-4 text-[#E4405F]" />
            </a>

            <a
              href="https://x.com/coursedig"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm hover:bg-white/95"
              aria-label="CourseDig on X"
              title="X"
            >
              <IconX className="h-4 w-4 text-[#111827]" />
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto max-w-7xl bg-white px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 rounded outline-none focus:ring-2 focus:ring-[color:var(--color-brand-soft)]"
            onClick={() => setMobileOpen(false)}
            aria-label="Go to homepage"
            title="CourseDig"
          >
            <Image
              src="/coursediglogo.png"
              alt="CourseDig logo"
              width={44}
              height={44}
              priority
              className="h-10 w-10 object-contain"
            />
            <span className="text-base font-bold text-[color:var(--color-brand)] transition-colors hover:text-[color:var(--color-brand-dark)]">
              CourseDig
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-7 md:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/"
                  ? activeHref === "/"
                  : activeHref?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cx(
                    "relative text-sm font-semibold text-gray-900",
                    "after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[color:var(--color-brand)] after:transition-transform after:duration-200",
                    "hover:after:scale-x-100",
                    active && "text-[color:var(--color-brand)] after:scale-x-100"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {!meLoaded ? null : (
              <>
                {isAuthed && (
                  <Link
                    href="/profile"
                    className={cx(
                      "relative text-sm font-semibold text-gray-900",
                      "after:absolute after:-bottom-2 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-[color:var(--color-brand)] after:transition-transform after:duration-200",
                      "hover:after:scale-x-100",
                      activeHref?.startsWith("/profile") &&
                        "text-[color:var(--color-brand)] after:scale-x-100"
                    )}
                  >
                    Profile
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-semibold text-gray-900 hover:text-[color:var(--color-brand)]"
                  >
                    Admin
                  </Link>
                )}

                {!isAuthed ? (
                  <Link
                    href="/login"
                    className="text-sm font-semibold text-gray-900 hover:text-[color:var(--color-brand)]"
                  >
                    Login
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm font-semibold text-gray-900 hover:text-[color:var(--color-brand)]"
                  >
                    Logout
                  </button>
                )}
              </>
            )}

            <Link
              href="/apply"
              className="rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
            >
              Apply Now
            </Link>
          </nav>

          {/* Mobile toggle */}
          <button
            type="button"
            className="md:hidden rounded-md border border-gray-300 p-2 text-gray-900 hover:bg-gray-50"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <IconClose className="h-5 w-5" />
            ) : (
              <IconMenu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4">
            <div className="grid gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  {item.label}
                </Link>
              ))}

              {!meLoaded ? null : (
                <>
                  {isAuthed && (
                    <Link
                      href="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Profile
                    </Link>
                  )}

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Admin
                    </Link>
                  )}

                  {!isAuthed ? (
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Login
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-md px-3 py-2 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  )}
                </>
              )}

              <Link
                href="/apply"
                onClick={() => setMobileOpen(false)}
                className="mt-1 rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-center text-sm font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
              >
                Apply Now
              </Link>

              {/* Mobile quick contact shortcuts */}
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="mt-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-center text-sm font-semibold text-[#25D366] hover:bg-gray-50"
              >
                Chat on WhatsApp
              </a>
              <a
                href={telHref}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-center text-sm font-semibold text-[color:var(--color-brand)] hover:bg-gray-50"
              >
                Call now
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
