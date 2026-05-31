"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

export function DeleteButton({
  medicineId,
  lang,
}: {
  medicineId: number;
  lang: Lang;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm(t(lang, "edit.confirmDelete"))) return;
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
      {loading ? t(lang, "edit.deleting") : t(lang, "edit.deleteMedicine")}
    </button>
  );
}
