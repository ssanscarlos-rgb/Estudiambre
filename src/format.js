export const colones = (n) => `₡${Number(n || 0).toLocaleString("es-CR")}`;

export const iniciales = (nombre = "") =>
  nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
