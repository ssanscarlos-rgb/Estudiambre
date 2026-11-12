import { AlertTriangle, Gauge, Bell } from "lucide-react";

// Cada tipo de notificación (campo `tipo` que publica ms-gastos-plan) sabe
// con qué ícono se muestra, qué severidad tiene y a qué pantalla lleva.
const TIPOS = {
  PRESUPUESTO_80: { Icon: Gauge, nivel: "aviso", ruta: "/plan", accion: "Ver mi plan" },
  PRESUPUESTO_100: { Icon: AlertTriangle, nivel: "alerta", ruta: "/plan", accion: "Ver mi plan" },
};

const GENERICO = { Icon: Bell, nivel: "info", ruta: null, accion: null };

export const infoDeTipo = (tipo) => TIPOS[tipo] || GENERICO;

// Solo rutas internas de la app ("/plan", "/registrar?q=..."): nunca una URL
// completa ni "//dominio", para que una notificación no pueda sacar al usuario del sitio.
const RUTA_INTERNA = /^\/(?!\/)[\w\-./?=&%#]*$/;

// A dónde lleva una notificación: la `ruta` que mande el backend (si es válida);
// si no, la que corresponde a su tipo. Los avisos de presupuesto con `categoria`
// abren el Plan resaltando esa categoría.
export function destinoDe(n) {
  if (!n) return null;
  if (typeof n.ruta === "string" && RUTA_INTERNA.test(n.ruta)) return n.ruta;
  const ruta = infoDeTipo(n.tipo).ruta;
  if (!ruta) return null;
  return n.categoria && ruta === "/plan" ? `${ruta}?categoria=${encodeURIComponent(n.categoria)}` : ruta;
}

export const accionDe = (n) => (destinoDe(n) ? infoDeTipo(n.tipo).accion || "Abrir" : null);

// Lo que llega por SignalR puede venir incompleto: se completan los campos que la UI usa.
export function normalizarNotificacion(n) {
  return { leida: false, fecha: Date.now(), ...n };
}
