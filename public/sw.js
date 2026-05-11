/* PowerFlow service worker — push notifications + click routing */

const ICON = "/icon-192.png";
const BADGE = "/icon-192.png";

self.addEventListener("install", (event) => {
  // Activate the new worker immediately so updates take effect on next load.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "PowerFlow", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "PowerFlow";
  const options = {
    body: data.body || "",
    icon: data.icon || ICON,
    badge: data.badge || BADGE,
    tag: data.tag || "powerflow",
    data: { url: data.url || "/" },
    requireInteraction: !!data.requireInteraction,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      // Focus an existing tab if one is already on the target URL
      for (const client of clientsArr) {
        if (client.url.endsWith(target) && "focus" in client) return client.focus();
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});
