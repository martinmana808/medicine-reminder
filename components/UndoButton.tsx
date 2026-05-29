"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UndoButton({ doseId }: { doseId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function undo() {
    setLoading(true);
    await fetch(`/api/doses/${doseId}/undo`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={undo}
      disabled={loading}
      className="text-xs text-slate-500 hover:text-amber-400 disabled:opacity-50"
    >
      {loading ? "…" : "Undo"}
    </button>
  );
}
