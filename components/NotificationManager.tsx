"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function NotificationManager() {
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
        setMessage("Permission denied — enable notifications in your settings.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key) {
        setMessage("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
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
      setMessage(res.ok ? "Notifications enabled on this device ✓" : "Failed to save subscription.");
    } catch (err) {
      setMessage("Could not enable: " + (err as Error).message);
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
      res.ok ? `Test sent to ${data.sent ?? 0} device(s).` : "Failed to send test.",
    );
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">
        Status: <span className="font-medium text-slate-900">{status}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={enable}
          disabled={busy || status === "unsupported"}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-50"
        >
          Enable notifications
        </button>
        <button
          onClick={sendTest}
          disabled={busy}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Send test notification
        </button>
      </div>
      {message && <p className="text-sm text-slate-600">{message}</p>}
    </div>
  );
}
