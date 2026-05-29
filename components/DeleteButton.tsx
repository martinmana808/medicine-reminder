"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ medicineId }: { medicineId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("Delete this medicine and its history?")) return;
    setLoading(true);
    await fetch(`/api/medicines/${medicineId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="text-xs text-slate-500 hover:text-red-400 disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
