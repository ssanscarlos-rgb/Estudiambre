// Helper único para todas las llamadas a APIM.
// Así cada página solo pide "products", "profile", etc, sin repetir
// la URL base ni el header de la subscription key en cada archivo.

const BASE_URL = process.env.REACT_APP_API_URL; // ej: https://tu-apim.azure-api.net/v1
const API_KEY = process.env.REACT_APP_API_KEY;

export async function apiGet(path) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    headers: {
      "Ocp-Apim-Subscription-Key": API_KEY || "",
    },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} en /${path}`);
  }

  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": API_KEY || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} en /${path}`);
  }

  return res.json();
}
