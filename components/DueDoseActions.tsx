"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function nowLocal(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function DueDoseActions({
  doseId,
  color,
}: {
  doseId: number;
  color: "red" | "yellow";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState(nowLocal);
  const [loading, setLoading] = useState(false);

  async function submit(takenAtIso?: string) {
    setLoading(true);
    await fetch(`/api/doses/${doseId}/taken`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(takenAtIso ? { takenAt: takenAtIso } : {}),
    });
    router.refresh();
    setLoading(false);
    setOpen(false);
  }

  const takeBtn =
    color === "red"
      ? "bg-red-500 text-white hover:bg-red-400"
      : "bg-amber-400 text-slate-900 hover:bg-amber-300";

  if (open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="rounded-md bg-slate-900/70 border border-slate-600 px-2 py-1.5 text-sm"
        />
        <button
          onClick={() => submit(new Date(when).toISOString())}
          disabled={loading}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold disabled:opacity-50 ${takeBtn}`}
        >
          {loading ? "Saving…" : "Mark taken"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-2 py-1.5 text-sm text-slate-300 hover:text-white"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={() => submit()}
        disabled={loading}
        className={`rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50 ${takeBtn}`}
      >
        {loading ? "Saving…" : "✓ Mark taken"}
      </button>
      <button
        onClick={() => {
          setWhen(nowLocal());
          setOpen(true);
        }}
        className="text-sm text-slate-300 hover:text-white underline-offset-2 hover:underline"
      >
        at a time…
      </button>
    </div>
  );
}
