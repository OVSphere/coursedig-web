// frontend/src/app/profile/page.tsx
"use client";

import Link from "next/link";
import { useMe } from "@/lib/useMe";

function formatDob(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // Keep it simple + consistent (UTC)
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min} UTC`;
}

export default function ProfilePage() {
  const { user: me, loading } = useMe();

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-140px)] bg-white">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">Loading your profile…</p>
          </div>
        </div>
      </main>
    );
  }

  if (!me) {
    return (
      <main className="min-h-[calc(100vh-140px)] bg-white">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">Your profile</h1>
            <p className="mt-2 text-sm text-gray-700">
              You need to sign in to view your profile.
            </p>
            <div className="mt-5">
              <Link
                href="/login?next=/profile"
                className="inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-5 py-3 text-sm font-semibold text-white hover:opacity-95"
              >
                Go to login →
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const locked = !!me.profileLockedAt;

  return (
    <main className="min-h-[calc(100vh-140px)] bg-white">
      <section className="border-b bg-[color:var(--color-brand-soft)]">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-3xl font-bold text-gray-900">My profile</h1>
          <p className="mt-2 text-sm text-gray-700">
            View your account details. Your identity information is protected and{" "}
            <span className="font-semibold">cannot be edited</span>.
          </p>

          {locked ? (
            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
              Your profile is locked. Any updates must be done by a Super Admin.
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-gray-200 bg-white/70 p-4 text-sm text-gray-700">
              Your profile will be locked after creation to protect your identity details.
            </div>
          )}

          {!me.emailVerifiedAt ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Your email is not verified yet. You can still log in, but some actions may be restricted
              until verification is complete.
            </div>
          ) : null}
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-gray-500">First name</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {me.firstName || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500">Last name</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {me.lastName || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500">Email</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {me.email || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500">Phone number</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {me.phoneNumber || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500">Date of birth</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDob(me.dateOfBirth) || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500">Email verification</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {me.emailVerifiedAt ? "Verified" : "Not verified"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500">Account created</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatDateTime(me.createdAt) || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500">Profile lock status</p>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {locked ? `Locked (${formatDateTime(me.profileLockedAt)})` : "Not locked"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/apply"
                className="inline-flex items-center rounded-md bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Continue to application →
              </Link>

              <Link
                href="/enquiry"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Request a change
              </Link>

              <Link
                href="/"
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
              >
                Back to home
              </Link>
            </div>

            <p className="mt-5 text-xs text-gray-500">
              If any detail is incorrect, use “Request a change”. Updates are handled by a Super Admin only.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
