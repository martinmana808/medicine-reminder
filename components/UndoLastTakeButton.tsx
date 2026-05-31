"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UndoLastTakeButton({ medicineId }: { medicineId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function undo() {
    setLoading(true);
    setMsg(null);
    const res = await fetch(`/api/medicines/${medicineId}/undo-last`, {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    setMsg(
      data.undone
        ? "✓ Undid your last take — next dose recalculated."
        : "Nothing to undo (no taken doses yet).",
    );
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <button
        onClick={undo}
        disabled={loading}
        className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "Undoing…" : "Undo last take"}
      </button>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
