"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Type = "interval" | "daily";

export type MedicineFormInitial = {
  id: number;
  name: string;
  type: Type;
  intervalHours: number | null;
  dailyTimes: string[] | null;
  startAtIso: string;
  durationDays: number | null;
};

function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function defaultStart(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return toDateTimeLocal(d);
}

export function MedicineForm({ initial }: { initial?: MedicineFormInitial }) {
  const router = useRouter();
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<Type>(initial?.type ?? "interval");
  const [intervalHours, setIntervalHours] = useState(
    initial?.intervalHours != null ? String(initial.intervalHours) : "8",
  );
  const [dailyTimes, setDailyTimes] = useState(
    initial?.dailyTimes?.join(", ") ?? "08:00",
  );
  const [startAt, setStartAt] = useState(
    initial ? toDateTimeLocal(new Date(initial.startAtIso)) : defaultStart(),
  );
  const [ongoing, setOngoing] = useState(
    initial ? initial.durationDays == null : false,
  );
  const [durationDays, setDurationDays] = useState(
    initial?.durationDays != null ? String(initial.durationDays) : "7",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const body = {
      name,
      type,
      intervalHours: type === "interval" ? Number(intervalHours) : null,
      dailyTimes:
        type === "daily"
          ? dailyTimes
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : null,
      startAt: new Date(startAt).toISOString(),
      durationDays: ongoing ? null : Number(durationDays),
    };

    const res = await fetch(
      isEdit ? `/api/medicines/${initial!.id}` : "/api/medicines",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.issues?.[0]?.message ?? "Could not save medicine.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  const field =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none";
  const label = "block text-sm font-medium text-slate-700 mb-1";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <label className={label}>Medicine name</label>
        <input
          className={field}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Amoxicillin"
          required
        />
      </div>

      <div>
        <label className={label}>Schedule</label>
        <div className="flex gap-2">
          {(["interval", "daily"] as Type[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium border ${
                type === t
                  ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                  : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t === "interval" ? "Every X hours" : "Fixed daily times"}
            </button>
          ))}
        </div>
      </div>

      {type === "interval" ? (
        <div>
          <label className={label}>Repeat every (hours)</label>
          <input
            className={field}
            type="number"
            min="0.5"
            step="0.5"
            value={intervalHours}
            onChange={(e) => setIntervalHours(e.target.value)}
          />
        </div>
      ) : (
        <div>
          <label className={label}>Times (comma separated, HH:MM)</label>
          <input
            className={field}
            value={dailyTimes}
            onChange={(e) => setDailyTimes(e.target.value)}
            placeholder="08:00, 20:00"
          />
        </div>
      )}

      <div>
        <label className={label}>
          {type === "interval" ? "First dose / start" : "Start from"}
        </label>
        <input
          className={field}
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={ongoing}
            onChange={(e) => setOngoing(e.target.checked)}
            className="accent-teal-600"
          />
          Ongoing (no end date)
        </label>
        {!ongoing && (
          <div className="mt-2">
            <label className={label}>Course length (days)</label>
            <input
              className={field}
              type="number"
              min="1"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : isEdit ? "Save changes" : "Add medicine"}
      </button>
    </form>
  );
}
