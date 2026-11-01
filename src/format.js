export const colones = (n) => `₡${Number(n || 0).toLocaleString("es-CR")}`;

export const iniciales = (nombre = "") =>
  nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre",
];

const inicioDeDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// Las fechas de la API son Epoch en milisegundos (UTC); aquí se muestran en
// la zona horaria del dispositivo. Si algún día el profe pide segundos, un
// valor menor a 1e11 se interpreta como segundos. Un texto (los mocks viejos
// devuelven "Hoy"/"Ayer") se muestra tal cual.
export function formatFecha(valor, ahora = new Date()) {
  if (typeof valor !== "number") return valor ?? "";
  const fecha = new Date(valor < 1e11 ? valor * 1000 : valor);
  if (Number.isNaN(fecha.getTime())) return "";

  const hora = fecha.toLocaleTimeString("es-CR", { hour: "numeric", minute: "2-digit" });
  const dias = Math.round((inicioDeDia(ahora) - inicioDeDia(fecha)) / 86400000);
  if (dias === 0) return `Hoy, ${hora}`;
  if (dias === 1) return `Ayer, ${hora}`;
  const dia = fecha.toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    ...(fecha.getFullYear() !== ahora.getFullYear() ? { year: "numeric" } : {}),
  });
  return `${dia}, ${hora}`;
}

// quincenaDias llega como arreglo de días [15, 30]; los mocks viejos traían
// un texto ("Días 1 y 15 de cada mes"), de ahí se sacan los números.
export function normalizarDias(valor) {
  const nums = Array.isArray(valor)
    ? valor.map(Number)
    : typeof valor === "string"
      ? (valor.match(/\d{1,2}/g) || []).map(Number)
      : [];
  const validos = nums.filter((n) => Number.isInteger(n) && n >= 1 && n <= 31);
  return [...new Set(validos)].sort((a, b) => a - b).slice(0, 2);
}

export function describirQuincena(valor) {
  if (typeof valor === "string") return valor;
  const dias = normalizarDias(valor);
  if (dias.length === 0) return "Sin definir";
  return dias.length === 1 ? `Día ${dias[0]} de cada mes` : `Días ${dias[0]} y ${dias[1]} de cada mes`;
}

// "Quincena del 15 al 30 de octubre": del último día de pago hasta el próximo.
export function quincenaLabel(valor, ahora = new Date()) {
  const dias = normalizarDias(valor);
  if (dias.length === 0) return "";

  const fechasDePago = [];
  for (const mes of [-1, 0, 1]) {
    const base = new Date(ahora.getFullYear(), ahora.getMonth() + mes, 1);
    const ultimo = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
    for (const d of dias) fechasDePago.push(new Date(base.getFullYear(), base.getMonth(), Math.min(d, ultimo)));
  }
  fechasDePago.sort((a, b) => a - b);

  const hoy = inicioDeDia(ahora);
  const inicio = [...fechasDePago].reverse().find((f) => f <= hoy);
  const fin = fechasDePago.find((f) => f > hoy);
  if (!inicio || !fin) return "";

  return inicio.getMonth() === fin.getMonth()
    ? `Quincena del ${inicio.getDate()} al ${fin.getDate()} de ${MESES[fin.getMonth()]}`
    : `Quincena del ${inicio.getDate()} de ${MESES[inicio.getMonth()]} al ${fin.getDate()} de ${MESES[fin.getMonth()]}`;
}
