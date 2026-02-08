// frontend/src/lib/useMe.ts
// NOTE (CourseDig update - support identity auto-fill)
// ✅ Extends MeUser with identity/profile fields returned by /api/auth/me

"use client";

import { useEffect, useState } from "react";

export type MeUser = {
  id: string;
  email: string;
  fullName: string | null;
  createdAt: string;

  // existing / may be present
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  emailVerifiedAt?: string | null;
  hasAdminSecondFactor?: boolean;

  // ✅ CHANGE (CourseDig): identity fields used to auto-fill applications
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null; // ISO string
  profileLockedAt?: string | null; // ISO string
};

export function useMe() {
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setUser(data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return { user, loading, refresh };
}