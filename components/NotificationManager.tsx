"use client";

import { useEffect, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function NotificationManager({ lang }: { lang: Lang }) {
  const [status, setStatus] = useState<string>("checking…");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus(
      typeof Notification === "undefined"
        ? "unsupported"
        : Notification.permission,
    );
  }, []);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      setStatus(permission);
      if (permission !== "granted") {
        setMessage(t(lang, "settings.permDenied"));
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setMessage(t(lang, "settings.missingKey"));
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key) as BufferSource,
      });
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(sub),
      });
      setMessage(
        res.ok ? t(lang, "settings.enabled") : t(lang, "settings.failedSave"),
      );
    } catch (err) {
      setMessage(t(lang, "settings.couldNotEnable", { err: (err as Error).message }));
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/test-notification", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setMessage(
      res.ok
        ? t(lang, "settings.testSent", { n: data.sent ?? 0 })
        : t(lang, "settings.testFailed"),
    );
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        {t(lang, "settings.status")}:{" "}
        <span className="font-medium text-slate-900">{status}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={enable}
          disabled={busy || status === "unsupported"}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
        >
          {t(lang, "settings.enable")}
        </button>
        <button
          onClick={sendTest}
          disabled={busy}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {t(lang, "settings.sendTest")}
        </button>
      </div>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
