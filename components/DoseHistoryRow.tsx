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

const statusStyles: Record<string, string> = {
  taken: "text-teal-400",
  due: "text-amber-400",
  skipped: "text-slate-500",
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
    "rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700";

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
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{props.medicineName}</p>
          <p className="text-xs text-slate-500">
            Scheduled {props.scheduledLabel}
          </p>
        </div>
        <div className="text-right">
          <p
            className={`text-sm font-medium capitalize ${
              statusStyles[props.status] ?? "text-slate-400"
            }`}
          >
            {props.status}
          </p>
          {props.takenLabel && (
            <p className="text-xs text-slate-500">{props.takenLabel}</p>
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
              className="rounded-md bg-teal-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-400"
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
                className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
              >
                Mark not taken
              </button>
            </>
          )}
          <button
            onClick={remove}
            disabled={loading}
            className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            Delete
          </button>
          <button
            onClick={close}
            className="px-2 py-1.5 text-sm text-slate-400 hover:text-white"
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
            className="rounded-md bg-slate-800 border border-slate-700 px-2 py-1.5 text-sm"
          />
          <button
            onClick={mode === "take" ? saveTake : saveEdit}
            disabled={loading}
            className="rounded-md bg-teal-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-400 disabled:opacity-50"
          >
            {loading ? "Saving…" : mode === "take" ? "Mark taken" : "Save time"}
          </button>
          <button
            onClick={close}
            className="px-2 py-1.5 text-sm text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {!menu && !mode && (
        <p className="mt-1 text-[11px] text-slate-600">Long-press for options</p>
      )}
    </li>
  );
}
