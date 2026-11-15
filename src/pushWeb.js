import { apiGet, apiPost } from "./api";

// Web Push: avisos aunque la app esté cerrada.
// 1. Se registra el service worker (public/sw.js), que es quien recibe los push.
// 2. Con el permiso de notificaciones ya dado, se pide a ms-notificaciones su clave pública VAPID
//    y el navegador crea una suscripción con ella (solo ese servidor puede enviarle push).
// 3. La suscripción ({endpoint, keys}) se guarda en ms-notificaciones, asociada al usuario.
// Cada vez que el backend emite una notificación, también la envía por push a esas suscripciones.

export const pushSoportado = () =>
  typeof window !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

export function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    /* sin service worker la app funciona igual, solo sin push */
  });
}

function aBytes(base64url) {
  const relleno = "=".repeat((4 - (base64url.length % 4)) % 4);
  const binario = atob((base64url + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

function mismaClave(suscripcion, clave) {
  const actual = suscripcion.options?.applicationServerKey;
  if (!actual) return false;
  const a = new Uint8Array(actual);
  return a.length === clave.length && a.every((b, i) => b === clave[i]);
}

// Crea (o reutiliza) la suscripción de este navegador y la registra para el usuario actual.
// Se puede llamar varias veces: el backend la guarda una sola vez por navegador.
export async function suscribirPush() {
  if (!pushSoportado() || Notification.permission !== "granted") return false;
  await navigator.serviceWorker.register("/sw.js");
  const registro = await navigator.serviceWorker.ready;

  const { clavePublica } = await apiGet("notificaciones/push/clave");
  const clave = aBytes(clavePublica);

  let suscripcion = await registro.pushManager.getSubscription();
  // Si el servidor cambió sus claves VAPID, la suscripción vieja ya no sirve.
  if (suscripcion && !mismaClave(suscripcion, clave)) {
    await suscripcion.unsubscribe();
    suscripcion = null;
  }
  if (!suscripcion) {
    suscripcion = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: clave });
  }

  await apiPost("notificaciones/push/suscripciones", suscripcion.toJSON());
  return true;
}

// Al apagar los avisos: avisa al backend y anula la suscripción en el navegador.
export async function bajaPush() {
  if (!pushSoportado()) return;
  const registro = await navigator.serviceWorker.getRegistration();
  const suscripcion = await registro?.pushManager.getSubscription();
  if (!suscripcion) return;
  try {
    await apiPost("notificaciones/push/suscripciones/baja", { endpoint: suscripcion.endpoint });
  } catch {
    /* si el backend no responde, igual se anula abajo: el próximo push dará 410 y se limpia solo */
  }
  await suscripcion.unsubscribe();
}

// Al cerrar sesión: anula la suscripción en el navegador para que los avisos de esta cuenta no
// le lleguen a quien use el navegador después. No llama al backend (el token ya no está): el
// próximo push a esa suscripción recibe 410 y el backend la borra.
export async function anularPushLocal() {
  if (!pushSoportado()) return;
  const registro = await navigator.serviceWorker.getRegistration();
  const suscripcion = await registro?.pushManager.getSubscription();
  await suscripcion?.unsubscribe();
}
