"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TakeButton({ doseId }: { doseId: number }) {
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
      className="rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-400 disabled:opacity-50"
    >
      {loading ? "Saving…" : "✓ Mark taken"}
    </button>
  );
}
