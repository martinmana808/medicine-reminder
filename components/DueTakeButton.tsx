"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DueTakeButton({ doseId }: { doseId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function take() {
    setLoading(true);
    await fetch(`/api/doses/${doseId}/taken`, { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={take}
      disabled={loading}
      className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 disabled:opacity-50"
    >
      {loading ? "Saving…" : "✓ Mark taken"}
    </button>
  );
}
