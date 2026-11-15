// Avisos del navegador. Dos caminos, con el mismo permiso y el mismo interruptor (Perfil):
// - App abierta (aunque sea en segundo plano): llega por SignalR y se muestra con la
//   Web Notifications API (mostrar(), abajo).
// - App cerrada: Web Push. Al activar, el navegador se suscribe (src/pushWeb.js) y
//   ms-notificaciones envía cada notificación también por push; la muestra public/sw.js.
// Ambos usan el tag `notif-<id>`, así que si coinciden el sistema deja un solo aviso.
// La preferencia es por navegador, porque el permiso también lo es.
import { bajaPush, suscribirPush } from "./pushWeb";
const CLAVE = "estudiambre_avisos_navegador";

export const soportado = () => typeof window !== "undefined" && "Notification" in window;
export const permiso = () => (soportado() ? Notification.permission : "unsupported");

export function activados() {
  try {
    return permiso() === "granted" && localStorage.getItem(CLAVE) === "1";
  } catch {
    return false;
  }
}

// Pide permiso (solo desde un clic del usuario) y guarda la preferencia.
export async function activar() {
  if (!soportado()) return "unsupported";
  let p = Notification.permission;
  if (p === "default") p = await Notification.requestPermission();
  try {
    localStorage.setItem(CLAVE, p === "granted" ? "1" : "0");
  } catch {
    /* sin acceso a localStorage */
  }
  if (p === "granted") {
    // Si el push falla (navegador sin soporte, backend sin claves), los avisos con la app
    // abierta siguen funcionando.
    await suscribirPush().catch(() => {});
  }
  return p;
}

export function desactivar() {
  try {
    localStorage.setItem(CLAVE, "0");
  } catch {
    /* sin acceso a localStorage */
  }
  bajaPush().catch(() => {});
}

// Muestra el aviso nativo. onClick recibe el clic (para llevar a la pantalla indicada).
export function mostrar(n, onClick) {
  if (!activados()) return false;
  try {
    const aviso = new Notification(n.titulo || "EstudiAmbre", {
      body: n.mensaje || "Tienes una notificación nueva",
      tag: n.id !== undefined ? `notif-${n.id}` : undefined,
    });
    aviso.onclick = () => {
      window.focus();
      aviso.close();
      onClick?.();
    };
    return true;
  } catch {
    return false;
  }
}
