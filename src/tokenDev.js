// Ayuda de desarrollo: el token de Google de la sesión actual, para pegarlo en Postman (variable `token`).
// Es la misma credencial que usa la app en sessionStorage; vence a la hora (claim `exp`).
const STORAGE_KEY = "estudiambre_google_credential";

export function leerToken() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

// Fecha de vencimiento (ms epoch UTC) o null si el token no se puede leer.
export function vencimientoDe(token) {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(decodeURIComponent(escape(atob(payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=")))));
    return json.exp ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

// Copia al portapapeles (con respaldo para navegadores que bloquean la API moderna).
export async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = texto;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}
