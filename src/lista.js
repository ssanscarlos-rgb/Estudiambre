// Lista de compras de Comparar. Vive en este navegador (localStorage, una por usuario):
// el contrato de la Fase II no define un recurso de listas, así que no viaja al servidor.
const clave = (email) => `estudiambre_lista_${email || "anon"}`;

export function leerLista(email) {
  try {
    const arr = JSON.parse(localStorage.getItem(clave(email)) || "[]");
    return Array.isArray(arr)
      ? arr.filter((i) => i && typeof i.producto === "string" && typeof i.tienda === "string" && Number(i.precio) > 0)
      : [];
  } catch {
    return [];
  }
}

export function guardarLista(email, items) {
  try {
    localStorage.setItem(clave(email), JSON.stringify(items));
  } catch {
    /* sin acceso a localStorage: la lista vive solo en pantalla */
  }
}

export const vaciarLista = (email) => guardarLista(email, []);

export const idItem = (producto, tienda) => `${producto}|${tienda}`;
export const totalLista = (items) => items.reduce((t, i) => t + i.precio * i.cantidad, 0);

// Texto corto para la descripción del gasto (máximo 80 caracteres).
export function descripcionDeCompra(items) {
  const nombres = items.map((i) => i.producto);
  let texto = `Compra: ${nombres.join(", ")}`;
  if (texto.length > 80) texto = `Compra de ${items.length} productos`;
  return texto;
}
