// src/app/admin/users/users-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type User = {
  id: string;
  email: string;
  fullName: string | null;
  emailVerifiedAt: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
};

type MeUser = {
  id: string;
  email: string;
  fullName: string | null;
  emailVerifiedAt: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;

  // ✅ boolean flag from /api/auth/me
  hasAdminSecondFactor?: boolean;
};

type ActionMode = "VERIFY_EMAIL" | "SET_ROLE" | "SET_SUPERADMIN_PASSWORD";

/* =========================
   UI helpers (SAFE)
   ========================= */

function roleLabel(u: Pick<User, "isAdmin" | "isSuperAdmin">) {
  return u.isSuperAdmin ? "Super Admin" : u.isAdmin ? "Admin" : "User";
}

function RoleBadge(u: Pick<User, "isAdmin" | "isSuperAdmin">) {
  if (u.isSuperAdmin) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
        ⚠ Super Admin
      </span>
    );
  }

  if (u.isAdmin) {
    return (
      <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
        Admin
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
      User
    </span>
  );
}

function safeDate(v: string) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function AdminUsersClient({ users }: { users: User[] }) {
  const [me, setMe] = useState<MeUser | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  const [q, setQ] = useState("");

  const filteredUsers = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;

    return users.filter((u) => {
      const name = (u.fullName || "").toLowerCase();
      return (
        u.email.toLowerCase().includes(s) ||
        name.includes(s) ||
        u.id.toLowerCase().includes(s)
      );
    });
  }, [q, users]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [mode, setMode] = useState<ActionMode | null>(null);

  const [justification, setJustification] = useState("");
  const [secondFactor, setSecondFactor] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [targetRole, setTargetRole] =
    useState<"USER" | "ADMIN" | "SUPER_ADMIN">("USER");

  const [newSecondFactor, setNewSecondFactor] = useState("");
  const [confirmSecondFactor, setConfirmSecondFactor] = useState("");
  const [showSecondFactor, setShowSecondFactor] = useState(false);

  const isSuperAdmin = !!me?.isSuperAdmin;

  // ✅ FIX: use boolean flag instead of hash
  const hasSecondFactor = !!me?.hasAdminSecondFactor;

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      setMeLoading(true);
      try {
        const res = await fetch("/api/auth/me");
        const json = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) setMe(json?.user || null);
        if (!cancelled && !res.ok) setMe(null);
      } catch {
        if (!cancelled) setMe(null);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, []);

  function resetModalState() {
    setError(null);
    setSuccess(null);
    setJustification("");
    setSecondFactor("");
    setTargetRole("USER");
    setNewSecondFactor("");
    setConfirmSecondFactor("");
    setShowSecondFactor(false);
  }

  function openVerifyEmail(u: User) {
    resetModalState();
    setSelectedUser(u);
    setMode("VERIFY_EMAIL");
  }

  function openSetRole(u: User) {
    resetModalState();
    setSelectedUser(u);
    setMode("SET_ROLE");

    if (u.isSuperAdmin) setTargetRole("SUPER_ADMIN");
    else if (u.isAdmin) setTargetRole("ADMIN");
    else setTargetRole("USER");
  }

  function openSetSuperAdminPassword() {
    resetModalState();
    setSelectedUser(null);
    setMode("SET_SUPERADMIN_PASSWORD");
  }

  function closeModal() {
    setSelectedUser(null);
    setMode(null);
    resetModalState();
  }

  async function doVerifyEmail() {
    if (!selectedUser) return;

    setError(null);
    setSuccess(null);

    if (!isSuperAdmin) {
      setError("Forbidden.");
      return;
    }

    if (justification.trim().length < 20) {
      setError("Justification must be at least 20 characters.");
      return;
    }

    // ✅ If second factor is set, require it
    if (hasSecondFactor && secondFactor.trim().length < 4) {
      setError("Enter your Super Admin password to confirm this action.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          justification,
          secondFactor: hasSecondFactor ? secondFactor : undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || "Verification failed.");
        return;
      }

      setSuccess("User email has been verified successfully.");
      setTimeout(() => window.location.reload(), 900);
    } catch (e: any) {
      setError(e?.message || "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function doSetRole() {
    if (!selectedUser) return;

    setError(null);
    setSuccess(null);

    if (!isSuperAdmin) {
      setError("Forbidden.");
      return;
    }

    if (me?.id === selectedUser.id) {
      setError("You cannot change your own role.");
      return;
    }

    if (justification.trim().length < 20) {
      setError("Justification must be at least 20 characters.");
      return;
    }

    // ✅ If second factor is set, require it
    if (hasSecondFactor && secondFactor.trim().length < 4) {
      setError("Enter your Super Admin password to confirm this action.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: targetRole,
          justification,
          secondFactor: hasSecondFactor ? secondFactor : undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || "Role update failed.");
        return;
      }

      setSuccess("User role updated successfully.");
      setTimeout(() => window.location.reload(), 900);
    } catch (e: any) {
      setError(e?.message || "Role update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function doSetSuperAdminPassword() {
    setError(null);
    setSuccess(null);

    if (!isSuperAdmin) {
      setError("Forbidden.");
      return;
    }

    if (newSecondFactor.trim().length < 8) {
      setError("Super Admin password must be at least 8 characters.");
      return;
    }

    if (newSecondFactor !== confirmSecondFactor) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch(`/api/admin/superadmin/second-factor/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newSecondFactor }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json?.message || "Failed to set Super Admin password.");
        return;
      }

      setSuccess("Super Admin password set successfully.");
      setTimeout(() => window.location.reload(), 900);
    } catch (e: any) {
      setError(e?.message || "Failed to set Super Admin password.");
    } finally {
      setBusy(false);
    }
  }

  const modalTitle =
    mode === "VERIFY_EMAIL"
      ? "Manually verify email"
      : mode === "SET_ROLE"
      ? "Change user role"
      : mode === "SET_SUPERADMIN_PASSWORD"
      ? "Set Super Admin password"
      : "";

  return (
    <main className="p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">
            View registered users and manage access levels.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-[color:var(--color-brand)] focus:ring-2 focus:ring-[color:var(--color-brand-soft)] sm:w-72"
            placeholder="Search by email, name, or ID…"
          />

          <div className="flex items-center gap-2">
            {meLoading ? (
              <span className="text-xs text-gray-500">Loading permissions…</span>
            ) : isSuperAdmin ? (
              <>
                {!hasSecondFactor ? (
                  <button
                    onClick={openSetSuperAdminPassword}
                    className="rounded-md bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Set Super Admin password
                  </button>
                ) : (
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    Super Admin secured
                  </span>
                )}
              </>
            ) : (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                Read-only view
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Verified</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Created</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredUsers.map((u) => {
              const isMe = me?.id === u.id;

              return (
                <tr
                  key={u.id}
                  className={
                    u.isSuperAdmin ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-gray-50"
                  }
                >
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3">{u.fullName || "—"}</td>
                  <td className="px-4 py-3">{u.emailVerifiedAt ? "✔ Verified" : "—"}</td>
                  <td className="px-4 py-3">
                    <RoleBadge {...u} />
                    {isMe && (
                      <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                        You
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{safeDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {isSuperAdmin ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openSetRole(u)}
                          disabled={isMe}
                          className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                            isMe
                              ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                              : "border-gray-300 bg-white hover:bg-gray-50"
                          }`}
                        >
                          Change role
                        </button>

                        {!u.emailVerifiedAt ? (
                          <button
                            onClick={() => openVerifyEmail(u)}
                            className="rounded-md bg-[color:var(--color-brand)] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[color:var(--color-brand-dark)]"
                          >
                            Verify email
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {mode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{modalTitle}</h2>

                {mode !== "SET_SUPERADMIN_PASSWORD" && selectedUser ? (
                  <>
                    <p className="mt-2 text-sm text-gray-700">
                      Target user:
                      <span className="ml-2 font-semibold text-gray-900">
                        {selectedUser.email}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Current role: {roleLabel(selectedUser)}
                    </p>
                  </>
                ) : null}
              </div>

              <button
                onClick={closeModal}
                disabled={busy}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Close
              </button>
            </div>

            {/* SET SUPER ADMIN PASSWORD */}
            {mode === "SET_SUPERADMIN_PASSWORD" ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                  <p className="font-semibold">Super Admin protection</p>
                  <p className="mt-1">
                    Set a secondary password used to approve sensitive actions (role changes,
                    manual verification, deletions).
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    New Super Admin password
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type={showSecondFactor ? "text" : "password"}
                      value={newSecondFactor}
                      onChange={(e) => setNewSecondFactor(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-3 text-sm"
                      placeholder="Minimum 8 characters"
                      disabled={busy}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecondFactor((v) => !v)}
                      className="whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                    >
                      {showSecondFactor ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    Confirm Super Admin password
                  </label>
                  <input
                    type={showSecondFactor ? "text" : "password"}
                    value={confirmSecondFactor}
                    onChange={(e) => setConfirmSecondFactor(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm"
                    placeholder="Re-enter password"
                    disabled={busy}
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>
                )}
                {success && (
                  <div className="rounded-md bg-green-50 p-2 text-sm text-green-800">
                    {success}
                  </div>
                )}

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={closeModal}
                    disabled={busy}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={doSetSuperAdminPassword}
                    disabled={busy}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Set password"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* SET ROLE */}
            {mode === "SET_ROLE" && selectedUser ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  Changing roles affects what the user can access. This action is audited.
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900">New role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white p-3 text-sm"
                    disabled={busy}
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Super Admin is top-level access. Use sparingly.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    Justification (required)
                  </label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm"
                    rows={4}
                    placeholder="Explain why you are changing this user’s role…"
                    disabled={busy}
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum 20 characters.</p>
                </div>

                {/* ✅ FIX: show input when hasSecondFactor = true */}
                {hasSecondFactor ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">
                      Super Admin password (required)
                    </label>
                    <input
                      type="password"
                      value={secondFactor}
                      onChange={(e) => setSecondFactor(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm"
                      placeholder="Enter Super Admin password"
                      disabled={busy}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    Super Admin password is not set yet. Set it first for safer approvals.
                  </div>
                )}

                {error && (
                  <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>
                )}
                {success && (
                  <div className="rounded-md bg-green-50 p-2 text-sm text-green-800">
                    {success}
                  </div>
                )}

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={closeModal}
                    disabled={busy}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={doSetRole}
                    disabled={busy}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {busy ? "Updating…" : "Confirm role change"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* VERIFY EMAIL */}
            {mode === "VERIFY_EMAIL" && selectedUser ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                  This will mark the user’s email as verified and invalidate any outstanding
                  verification tokens.
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900">
                    Justification (required)
                  </label>
                  <textarea
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm"
                    rows={4}
                    placeholder="Explain why this verification is being performed…"
                    disabled={busy}
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum 20 characters.</p>
                </div>

                {hasSecondFactor ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900">
                      Super Admin password (required)
                    </label>
                    <input
                      type="password"
                      value={secondFactor}
                      onChange={(e) => setSecondFactor(e.target.value)}
                      className="mt-2 w-full rounded-md border border-gray-300 p-3 text-sm"
                      placeholder="Enter Super Admin password"
                      disabled={busy}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                    Super Admin password is not set yet. Set it first for safer approvals.
                  </div>
                )}

                {error && (
                  <div className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</div>
                )}
                {success && (
                  <div className="rounded-md bg-green-50 p-2 text-sm text-green-800">
                    {success}
                  </div>
                )}

                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={closeModal}
                    disabled={busy}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={doVerifyEmail}
                    disabled={busy}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {busy ? "Verifying…" : "Confirm verification"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </main>
  );
}
