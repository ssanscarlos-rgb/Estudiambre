import { AlertTriangle, Gauge, Bell, Heart, Lightbulb, Clock, GraduationCap, PartyPopper } from "lucide-react";

// Ícono del colón para las notificaciones de precios (lucide no lo trae).
function Colon({ size = 16 }) {
  return (
    <span className="icono-colon" style={{ fontSize: Math.round(size * 1.1) }}>
      ₡
    </span>
  );
}

// Cada tipo de notificación (campo `tipo` que manda ms-notificaciones) sabe con qué ícono se
// muestra, qué estilo tiene y a qué pantalla lleva. "destacado" = ícono blanco sobre verde.
const TIPOS = {
  PRESUPUESTO_80: { Icon: Gauge, nivel: "aviso", ruta: "/plan", accion: "Ver mi plan" },
  PRESUPUESTO_100: { Icon: AlertTriangle, nivel: "alerta", ruta: "/plan", accion: "Ver mi plan" },
  BIENVENIDA: { Icon: Heart, nivel: "destacado", ruta: "/plan", accion: "Ver mi plan" },
  RECOMENDACION: { Icon: Lightbulb, nivel: "destacado", ruta: "/notificaciones", accion: null },
  PRECIO: { Icon: Colon, nivel: "destacado", ruta: "/comparar", accion: "Ir al comparador" },
  EVENTO_TEC: { Icon: GraduationCap, nivel: "destacado", ruta: "/plan", accion: "Ver mi plan" },
  EVENTO: { Icon: PartyPopper, nivel: "info", ruta: "/", accion: null },
  INACTIVIDAD: { Icon: Clock, nivel: "info", ruta: "/registrar", accion: null },
};

const GENERICO = { Icon: Bell, nivel: "info", ruta: null, accion: null };

// Texto del botón según la pantalla a la que lleva (cuando el tipo no trae uno propio).
const ACCION_POR_RUTA = {
  "/": "Ir al inicio",
  "/plan": "Ver mi plan",
  "/registrar": "Registrar un gasto",
  "/comparar": "Ir al comparador",
  "/perfil": "Ir a mi perfil",
};

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

// Botón de acción en la página de notificaciones. No se muestra si lleva a la misma página.
export function accionDe(n) {
  const destino = destinoDe(n);
  if (!destino || destino.startsWith("/notificaciones")) return null;
  return infoDeTipo(n.tipo).accion || ACCION_POR_RUTA[destino.split("?")[0]] || "Abrir";
}

// Lo que llega por SignalR puede venir incompleto: se completan los campos que la UI usa.
export function normalizarNotificacion(n) {
  return { leida: false, fecha: Date.now(), ...n };
}
