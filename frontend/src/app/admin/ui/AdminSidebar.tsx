// frontend/src/app/admin/ui/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

type MeUser = {
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function AdminSidebar() {
  const pathname = usePathname() || "/admin";
  const [me, setMe] = useState<MeUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) setMe(json?.user || null);
      } catch {
        /* ignore */
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  const isSuperAdmin = !!me?.isSuperAdmin;
  const isAdminOrSuperAdmin = !!me?.isAdmin || !!me?.isSuperAdmin;

  const itemClass = (href: string) => {
    const active = isActive(pathname, href);
    return cx(
      "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-semibold transition",
      active
        ? "bg-[color:var(--color-brand-soft)] text-gray-900 ring-1 ring-[color:var(--color-brand)]/20"
        : "text-gray-800 hover:bg-gray-50"
    );
  };

  const activePill = (href: string) => {
    const active = isActive(pathname, href);
    return (
      <span
        className={cx(
          "ml-2 inline-flex h-2 w-2 rounded-full",
          active ? "bg-[color:var(--color-brand)]" : "bg-transparent"
        )}
        aria-hidden="true"
      />
    );
  };

  return (
    <aside className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          Admin panel
        </p>

        {/* Optional small “home” hint */}
        <Link
          href="/admin"
          className="text-xs font-semibold text-[color:var(--color-brand)] hover:underline"
        >
          Home
        </Link>
      </div>

      {/* ✅ Quick actions */}
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Quick actions
        </p>

        <div className="mt-3 grid gap-2">
          <Link
            href="/admin/courses/new"
            className="inline-flex w-full items-center justify-center rounded-md bg-[color:var(--color-brand)] px-3 py-2 text-sm font-semibold text-white hover:opacity-95"
          >
            + New course
          </Link>

          {/* Newsletter should be visible to Admin + Super Admin */}
          {isAdminOrSuperAdmin && (
            <Link
              href="/admin/newsletter"
              className="inline-flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Newsletter
            </Link>
          )}
        </div>
      </div>

      {/* ✅ Navigation */}
      <div className="mt-4">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Navigation
        </p>

        <nav className="mt-2 grid gap-1">
          {/* Dashboard first (better UX than alphabetical) */}
          <Link className={itemClass("/admin")} href="/admin">
            <span>Dashboard</span>
            {activePill("/admin")}
          </Link>

          <Link className={itemClass("/admin/applications")} href="/admin/applications">
            <span>Applications</span>
            {activePill("/admin/applications")}
          </Link>

          <Link className={itemClass("/admin/courses")} href="/admin/courses">
            <span>Courses</span>
            {activePill("/admin/courses")}
          </Link>

          <Link className={itemClass("/admin/enquiries")} href="/admin/enquiries">
            <span>Enquiries</span>
            {activePill("/admin/enquiries")}
          </Link>

          <Link className={itemClass("/admin/fees")} href="/admin/fees">
            <span>Fees</span>
            {activePill("/admin/fees")}
          </Link>

          {/* ✅ Only show Newsletter in the list if you want it here too.
              If you prefer ONLY the Quick Action button, remove this block. */}
          {isAdminOrSuperAdmin && (
            <Link className={itemClass("/admin/newsletter")} href="/admin/newsletter">
              <span>Newsletter</span>
              {activePill("/admin/newsletter")}
            </Link>
          )}
        </nav>
      </div>

      {/* ✅ Admin-only (Super Admin) */}
      {isSuperAdmin && (
        <div className="mt-4 border-t pt-4">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Admin
          </p>

          <nav className="mt-2 grid gap-1">
            <Link className={itemClass("/admin/users")} href="/admin/users">
              <span>Users</span>
              {activePill("/admin/users")}
            </Link>
          </nav>
        </div>
      )}

      {/* ✅ Exit */}
      <div className="mt-4 border-t pt-4">
        <Link
          className="inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-semibold text-[color:var(--color-brand)] hover:bg-gray-50"
          href="/"
        >
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}
