"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TimezoneForm({ current }: { current: string }) {
  const router = useRouter();
  const [tz, setTz] = useState(current);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const zones =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [current, "UTC"];

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ timezone: tz }),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved ✓" : "Could not save timezone.");
    if (res.ok) router.refresh();
  }

  function useDeviceZone() {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTz(detected);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select
          value={tz}
          onChange={(e) => setTz(e.target.value)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
        >
          {zones.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
        >
          Save
        </button>
      </div>
      <button
        onClick={useDeviceZone}
        className="text-xs font-medium text-teal-600 hover:underline"
      >
        Use this device&apos;s timezone
      </button>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
