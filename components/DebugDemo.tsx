"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DebugDemo() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function call(method: "POST" | "DELETE", label: string) {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/debug/demo", { method });
    setMsg(res.ok ? label : "Something went wrong.");
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => call("POST", "Created demo cards — see the Today tab.")}
          disabled={busy}
          className="rounded-md bg-amber-500/20 border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/30 disabled:opacity-50"
        >
          Create demo (yellow + red)
        </button>
        <button
          onClick={() => call("DELETE", "Demo data cleared.")}
          disabled={busy}
          className="rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:opacity-50"
        >
          Clear demo
        </button>
      </div>
      {msg && <p className="text-sm text-slate-300">{msg}</p>}
    </div>
  );
}
