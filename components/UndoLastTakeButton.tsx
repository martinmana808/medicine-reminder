"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

export function UndoLastTakeButton({
  medicineId,
  lang,
}: {
  medicineId: number;
  lang: Lang;
}) {
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
    setMsg(data.undone ? t(lang, "edit.undone") : t(lang, "edit.nothingToUndo"));
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
        {loading ? t(lang, "edit.undoing") : t(lang, "edit.undoLastTake")}
      </button>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
