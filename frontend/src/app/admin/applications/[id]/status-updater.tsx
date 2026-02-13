//frontend/src/app/admin/applications/[id]/status-updater.tsx
"use client";

import { useState } from "react";

export default function StatusUpdater(props: {
  id: string;
  disabled: boolean;
  initialStatus: string;
  options: { value: string; label: string }[];
}) {
  const { id, disabled, initialStatus, options } = props;

  const [status, setStatus] = useState(initialStatus || "SUBMITTED");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function saveStatus() {
    if (!id) return;
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch(`/api/admin/applications/${encodeURIComponent(id)}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || "Failed to update status.");

      setMsg("Status updated.");
    } catch (e: any) {
      setMsg(e?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold text-gray-500">UPDATE STATUS</p>

      {msg && <p className="mt-2 text-xs text-gray-700">{msg}</p>}

      <div className="mt-3 flex items-center gap-2">
        <select
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={disabled}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={saveStatus}
          disabled={saving || disabled}
          className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
            saving || disabled ? "bg-gray-400" : "bg-[color:var(--color-brand)] hover:opacity-95"
          }`}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Tip: “Offer made” is final for Course applications; “Granted” is final for Scholarship.
      </p>
    </div>
  );
}
