// frontend/src/app/components/Header.tsx
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

  // Load on mount
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

  // Refetch on route change (so UI updates after login/logout)
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
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <a
              href={telHref}
              className="hover:underline decoration-white/70 underline-offset-2"
            >
              <span className="font-semibold text-white">Tel:</span> 0161 388 2338
            </a>

            <span className="hidden text-white/70 md:inline">•</span>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white hover:underline decoration-white/70 underline-offset-2"
              title="WhatsApp"
            >
              WhatsApp
            </a>
          </div>

          <div className="flex items-center gap-2 text-white">
            <a
              href="https://www.facebook.com/yourcoursedig/"
              target="_blank"
              rel="noreferrer"
              className="rounded p-1 hover:bg-white/15"
              aria-label="CourseDig on Facebook"
              title="Facebook"
            >
              <IconFacebook className="h-4 w-4" />
            </a>

            <a
              href="https://www.instagram.com/coursedig/"
              target="_blank"
              rel="noreferrer"
              className="rounded p-1 hover:bg-white/15"
              aria-label="CourseDig on Instagram"
              title="Instagram"
            >
              <IconInstagram className="h-4 w-4" />
            </a>

            <a
              href="https://x.com/coursedig"
              target="_blank"
              rel="noreferrer"
              className="rounded p-1 hover:bg-white/15"
              aria-label="CourseDig on X"
              title="X"
            >
              <IconX className="h-4 w-4" />
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

            {/* ✅ Only render these links once /me has loaded (prevents flicker) */}
            {!meLoaded ? null : (
              <>
                {/* ✅ Profile (only when logged in) */}
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

                {/* ✅ Admin link */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-semibold text-gray-900 hover:text-[color:var(--color-brand)]"
                  >
                    Admin
                  </Link>
                )}

                {/* Auth links */}
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
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
