"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LANGUAGES, type Lang } from "@/lib/i18n";

export function LanguageForm({ current }: { current: Lang }) {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>(current);
  const [saving, setSaving] = useState(false);

  async function choose(next: Lang) {
    setLang(next);
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ language: next }),
    });
    router.refresh();
    setSaving(false);
  }

  return (
    <div className="flex gap-2">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          onClick={() => choose(l.code)}
          disabled={saving}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
            lang === l.code
              ? "border-teal-600 bg-teal-600 text-white shadow-sm"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
