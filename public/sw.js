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
      // Focus an existing tab if one is already on the target URL.
      // Compare parsed pathnames rather than using endsWith: a tab sitting on
      // "/today?foo=1" or "/library#pmr" never matched, so every notification
      // opened a duplicate tab.
      const targetPath = new URL(target, self.location.origin).pathname;
      for (const client of clientsArr) {
        let clientPath;
        try { clientPath = new URL(client.url).pathname; } catch { continue; }
        if (clientPath === targetPath && "focus" in client) return client.focus();
      }
      // Otherwise open a new tab
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});
