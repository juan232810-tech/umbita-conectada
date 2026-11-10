self.addEventListener("push", event => {
    let datos = { title: "UMBITA CONECTADA", body: "Hay un aviso nuevo en la comunidad." };
    try { datos = event.data.json(); } catch (e) {}
    event.waitUntil(self.registration.showNotification(datos.title, {
        body: datos.body,
        icon: "icon-192.png",
        badge: "icon-192.png",
        data: { url: "./" }
    }));
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(lista => {
            for (const c of lista) { if ("focus" in c) return c.focus(); }
            return clients.openWindow(event.notification.data.url);
        })
    );
});