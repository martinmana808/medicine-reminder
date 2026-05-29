"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ medicineId }: { medicineId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("Delete this medicine and its history? This cannot be undone."))
      return;
    setLoading(true);
    await fetch(`/api/medicines/${medicineId}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="w-full rounded-md border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete medicine"}
    </button>
  );
}
