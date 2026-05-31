/* Medicine Reminder service worker: push display + notification actions. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Medicine reminder", body: event.data && event.data.text() };
  }

  const doseId = data.doseId;
  const options = {
    body: data.body || "",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: doseId ? "dose-" + doseId : "med-reminder",
    renotify: true,
    requireInteraction: true,
    data: { doseId: doseId, url: data.url || "/" },
    actions: doseId
      ? [
          { action: "taken", title: data.takenLabel || "✓ Taken" },
          { action: "snooze", title: data.snoozeLabel || "Snooze 10m" },
        ]
      : [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Medicine reminder", options),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const doseId = data.doseId;
  const url = data.url || "/";

  if (event.action === "taken" && doseId) {
    event.waitUntil(fetch("/api/doses/" + doseId + "/taken", { method: "POST" }));
    return;
  }
  if (event.action === "snooze" && doseId) {
    event.waitUntil(
      fetch("/api/doses/" + doseId + "/snooze", { method: "POST" }),
    );
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow(url);
      }),
  );
});
