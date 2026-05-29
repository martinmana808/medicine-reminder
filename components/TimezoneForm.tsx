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
          className="flex-1 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
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
          className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-400 disabled:opacity-50"
        >
          Save
        </button>
      </div>
      <button
        onClick={useDeviceZone}
        className="text-xs text-teal-400 hover:underline"
      >
        Use this device&apos;s timezone
      </button>
      {message && <p className="text-sm text-slate-300">{message}</p>}
    </div>
  );
}
