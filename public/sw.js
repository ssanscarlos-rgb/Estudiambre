/* Service worker de EstudiAmbre: recibe los Web Push de ms-notificaciones.
   El navegador lo mantiene registrado aunque la app esté cerrada: cuando el servicio de push
   (Google, Mozilla, Apple) entrega un mensaje, el navegador despierta este script, que muestra
   el aviso del sistema. El mensaje llega cifrado y el navegador lo descifra antes de dárselo. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// Misma regla que destinoDe() en src/notificaciones.js: la `ruta` que manda el backend (solo rutas
// internas); si no, los avisos de presupuesto abren el Plan en su categoría y el resto, la pantalla
// de notificaciones. Se agrega ?notif=<id> para que la app la marque como leída al abrir.
const RUTA_INTERNA = /^\/(?!\/)[\w\-./?=&%#]*$/;
function destino(n) {
  let url = "/notificaciones";
  if (typeof n.ruta === "string" && RUTA_INTERNA.test(n.ruta)) url = n.ruta;
  else if (n.tipo === "PRESUPUESTO_80" || n.tipo === "PRESUPUESTO_100")
    url = n.categoria ? `/plan?categoria=${encodeURIComponent(n.categoria)}` : "/plan";
  if (n.id) url += (url.includes("?") ? "&" : "?") + "notif=" + encodeURIComponent(n.id);
  return url;
}

self.addEventListener("push", (event) => {
  let n = {};
  try {
    n = event.data ? event.data.json() : {};
  } catch {
    n = { mensaje: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    (async () => {
      // Si la app está a la vista, la campana y el toast ya la muestran (llegó por SignalR).
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (ventanas.some((v) => v.visibilityState === "visible")) return;

      await self.registration.showNotification(n.titulo || "EstudiAmbre", {
        body: n.mensaje || "Tenés una notificación nueva",
        icon: "/logo.png",
        badge: "/logo.png",
        // Mismo tag que el aviso de la pestaña (src/avisosNavegador.js): si salen los dos, el
        // sistema deja uno solo.
        tag: n.id ? `notif-${n.id}` : undefined,
        data: { url: destino(n) },
      });
    })()
  );
});

// Al tocar el aviso: enfoca la app si ya está abierta (y navega), o la abre.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/notificaciones", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const abierta = ventanas.find((v) => new URL(v.url).origin === self.location.origin);
      if (abierta) {
        await abierta.focus();
        try {
          await abierta.navigate(url);
        } catch {
          /* pestaña sin controlar por este SW: queda enfocada en su pantalla */
        }
        return;
      }
      await self.clients.openWindow(url);
    })()
  );
});
