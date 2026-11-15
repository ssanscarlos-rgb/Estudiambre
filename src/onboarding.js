// Asistente de bienvenida: planes predefinidos y cálculo del reparto del presupuesto.
// Todo es un punto de partida: la persona puede editar cada número antes de guardar.

export const CATEGORIAS_SUGERIDAS = [
  "Comida", "Transporte", "Servicios", "Estudio", "Antojos", "Otros",
  "Salud", "Ropa", "Entretenimiento", "Mascotas", "Hogar",
];

// `categorias` = peso de cada categoría (porcentaje del presupuesto de gasto).
export const PLANES = [
  {
    id: "casa",
    nombre: "Estudiante en casa",
    descripcion: "Vivís con tu familia: tus gastos son comida, pasajes y estudio.",
    ingreso: 100000,
    ahorroPct: 20,
    categorias: { Comida: 35, Transporte: 25, Estudio: 15, Antojos: 15, Otros: 10 },
  },
  {
    id: "independiente",
    nombre: "Estudiante independiente",
    descripcion: "Pagás alquiler o servicios además de comida y transporte.",
    ingreso: 200000,
    ahorroPct: 10,
    categorias: { Comida: 30, Servicios: 25, Transporte: 15, Estudio: 10, Antojos: 10, Otros: 10 },
  },
  {
    id: "ahorro",
    nombre: "Ahorro fuerte",
    descripcion: "Recortás gastos para guardar una parte más grande de tu ingreso.",
    ingreso: 150000,
    ahorroPct: 30,
    categorias: { Comida: 40, Transporte: 20, Servicios: 15, Estudio: 15, Otros: 10 },
  },
  {
    id: "personalizado",
    nombre: "Personalizado",
    descripcion: "Empezás con las categorías básicas repartidas parejo y lo ajustás a tu gusto.",
    ingreso: 150000,
    ahorroPct: 15,
    categorias: { Comida: 20, Transporte: 20, Servicios: 20, Estudio: 20, Antojos: 10, Otros: 10 },
  },
];

export const OPCIONES_AHORRO = [10, 20, 30];

const aCien = (n) => Math.round(n / 100) * 100;

// Presupuesto de gasto = ingreso menos lo que se quiere ahorrar.
export const ahorroEn = (ingreso, pct) => aCien((Number(ingreso) || 0) * (Number(pct) || 0) / 100);
export const metaDeGasto = (ingreso, pct) => Math.max(0, aCien(Number(ingreso) || 0) - ahorroEn(ingreso, pct));

// Reparte `meta` entre `nombres` según los pesos del plan (las que no tienen peso reciben el promedio).
// Los montos salen en múltiplos de 100 y suman exactamente `meta` (el ajuste va a la categoría más grande).
export function repartir(meta, nombres, pesos = {}) {
  if (!nombres.length || !(meta > 0)) return Object.fromEntries(nombres.map((n) => [n, 0]));
  const conPeso = nombres.filter((n) => pesos[n] > 0);
  const promedio = conPeso.length ? conPeso.reduce((t, n) => t + pesos[n], 0) / conPeso.length : 1;
  const w = Object.fromEntries(nombres.map((n) => [n, pesos[n] > 0 ? pesos[n] : promedio]));
  const total = nombres.reduce((t, n) => t + w[n], 0);
  const montos = Object.fromEntries(nombres.map((n) => [n, aCien((meta * w[n]) / total)]));
  const mayor = nombres.reduce((a, b) => (montos[b] > montos[a] ? b : a), nombres[0]);
  const diferencia = meta - nombres.reduce((t, n) => t + montos[n], 0);
  montos[mayor] = Math.max(0, montos[mayor] + diferencia);
  return montos;
}
