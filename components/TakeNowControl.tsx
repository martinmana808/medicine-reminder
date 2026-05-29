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

export function TakeNowControl({ medicineId }: { medicineId: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState(nowLocal);
  const [loading, setLoading] = useState(false);

  async function submit(takenAtIso: string) {
    setLoading(true);
    await fetch(`/api/medicines/${medicineId}/take`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ takenAt: takenAtIso }),
    });
    router.refresh();
    setLoading(false);
    setOpen(false);
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => submit(new Date().toISOString())}
          disabled={loading}
          className="rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Taken now"}
        </button>
        <button
          onClick={() => {
            setWhen(nowLocal());
            setOpen(true);
          }}
          className="rounded-md px-2 py-1.5 text-sm text-slate-500 hover:text-slate-300"
        >
          at a time…
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        className="rounded-md bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
      />
      <button
        onClick={() => submit(new Date(when).toISOString())}
        disabled={loading}
        className="rounded-md bg-teal-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-400 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Mark taken"}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="text-sm text-slate-400 hover:text-white"
      >
        Cancel
      </button>
    </div>
  );
}
