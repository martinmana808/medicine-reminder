"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { t, type Lang } from "@/lib/i18n";

export function DebugDemo({ lang }: { lang: Lang }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function call(method: "POST" | "DELETE", successKey: string) {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/debug/demo", { method });
    setMsg(res.ok ? t(lang, successKey) : t(lang, "settings.demoError"));
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => call("POST", "settings.demoCreated")}
          disabled={busy}
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
        >
          {t(lang, "settings.createDemo")}
        </button>
        <button
          onClick={() => call("DELETE", "settings.demoCleared")}
          disabled={busy}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {t(lang, "settings.clearDemo")}
        </button>
      </div>
      {msg && <p className="text-sm text-slate-600">{msg}</p>}
    </div>
  );
}
