// Avisos del navegador (Web Notifications API): cuando llega una notificación en
// tiempo real y la pestaña no está a la vista, el sistema muestra un aviso nativo.
// Funciona mientras la app esté abierta (aunque sea en segundo plano). Un push con la
// app cerrada necesitaría Web Push (service worker + servidor con claves VAPID).
// La preferencia es por navegador, porque el permiso también lo es.
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
  return p;
}

export function desactivar() {
  try {
    localStorage.setItem(CLAVE, "0");
  } catch {
    /* sin acceso a localStorage */
  }
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
