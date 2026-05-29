"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

function isoToLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function nowLocal(): string {
  return isoToLocal(new Date().toISOString());
}

const statusChip: Record<string, string> = {
  taken: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  due: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  skipped: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
};

type EditMode = null | "take" | "edit";

export function DoseHistoryRow(props: {
  id: number;
  medicineName: string;
  status: string;
  scheduledLabel: string;
  takenLabel: string | null;
  takenAtIso: string;
}) {
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [mode, setMode] = useState<EditMode>(null);
  const [when, setWhen] = useState(() => isoToLocal(props.takenAtIso));
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startPress() {
    timer.current = setTimeout(() => setMenu(true), 450);
  }
  function cancelPress() {
    if (timer.current) clearTimeout(timer.current);
  }
  function close() {
    setMenu(false);
    setMode(null);
  }

  async function call(input: RequestInfo, init: RequestInit) {
    setLoading(true);
    await fetch(input, init);
    router.refresh();
    setLoading(false);
    close();
  }

  async function remove() {
    if (!confirm(`Delete this ${props.medicineName} dose?`)) return;
    await call(`/api/doses/${props.id}`, { method: "DELETE" });
  }
  function markNotTaken() {
    return call(`/api/doses/${props.id}/undo`, { method: "POST" });
  }
  function saveTake() {
    return call(`/api/doses/${props.id}/taken`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ takenAt: new Date(when).toISOString() }),
    });
  }
  function saveEdit() {
    return call(`/api/doses/${props.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ takenAt: new Date(when).toISOString() }),
    });
  }

  const btn =
    "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50";

  return (
    <li
      className="px-4 py-3 select-none"
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerLeave={cancelPress}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu(true);
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">{props.medicineName}</p>
          <p className="text-xs text-slate-500">
            Scheduled {props.scheduledLabel}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
              statusChip[props.status] ?? "bg-slate-100 text-slate-500"
            }`}
          >
            {props.status}
          </span>
          {props.takenLabel && (
            <p className="text-xs text-slate-400">{props.takenLabel}</p>
          )}
        </div>
      </div>

      {menu && !mode && (
        <div className="mt-3 flex flex-wrap gap-2">
          {props.status === "due" ? (
            <button
              onClick={() => {
                setWhen(nowLocal());
                setMode("take");
              }}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              Mark taken
            </button>
          ) : (
            <>
              <button onClick={() => setMode("edit")} className={btn}>
                Edit time taken
              </button>
              <button
                onClick={markNotTaken}
                disabled={loading}
                className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                Mark not taken
              </button>
            </>
          )}
          <button
            onClick={remove}
            disabled={loading}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={close}
            className="px-2 py-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {mode && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900"
          />
          <button
            onClick={mode === "take" ? saveTake : saveEdit}
            disabled={loading}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
          >
            {loading ? "Saving…" : mode === "take" ? "Mark taken" : "Save time"}
          </button>
          <button
            onClick={close}
            className="px-2 py-1.5 text-sm text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {!menu && !mode && (
        <p className="mt-1 text-[11px] text-slate-400">Long-press for options</p>
      )}
    </li>
  );
}
