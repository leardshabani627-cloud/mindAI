// Mind's service worker: opens Mind when a check-in reminder notification is clicked.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => "focus" in w);
      if (open) return open.focus().then((w) => (w && "navigate" in w ? w.navigate(url).catch(() => w) : w));
      return self.clients.openWindow(url);
    }),
  );
});
