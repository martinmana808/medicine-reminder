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
      className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      {loading ? "Deleting…" : "Delete medicine"}
    </button>
  );
}
