// Fase II: cada recurso vive en su propio microservicio detrás de APIM.
// REACT_APP_API_URL es la base por defecto (sirve mientras todo sea mock o
// una sola API); cada microservicio puede tener su propia base si en APIM
// quedó como una API aparte (ver README).
const trimSlash = (s) => (s || "").replace(/\/+$/, "");
const DEFAULT_BASE = trimSlash(process.env.REACT_APP_API_URL);

const BASES = {
  gastosPlan: trimSlash(process.env.REACT_APP_API_URL_GASTOS_PLAN) || DEFAULT_BASE,
  notificaciones: trimSlash(process.env.REACT_APP_API_URL_NOTIFICACIONES) || DEFAULT_BASE,
  perfilPrecios: trimSlash(process.env.REACT_APP_API_URL_PERFIL_PRECIOS) || DEFAULT_BASE,
};

// Primer segmento de la ruta → microservicio dueño del recurso.
const SERVICIO_POR_RECURSO = {
  gastos: "gastosPlan",
  plan: "gastosPlan",
  resumen: "gastosPlan",
  notificaciones: "notificaciones",
  perfil: "perfilPrecios",
  precios: "perfilPrecios",
};

function baseFor(path) {
  const recurso = path.split(/[/?]/)[0];
  return BASES[SERVICIO_POR_RECURSO[recurso]] || DEFAULT_BASE;
}

// El token lo setea auth.js apenas Google confirma la sesión. Se guarda
// como variable de módulo (no en React state) para que cualquier llamada
// a apiGet/apiPost, incluso fuera de un componente, use siempre el token
// más reciente sin tener que pasarlo como parámetro en cada lugar.
let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

export class ApiError extends Error {
  constructor(message, status, correlationId) {
    super(message);
    this.status = status;
    this.correlationId = correlationId;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${baseFor(path)}/${path}`, {
      ...options,
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiError("network", 0);
  }
  const text = await res.text();
  if (!res.ok) {
    // Los microservicios responden { status, message, correlationId }.
    let body = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      /* cuerpo que no es JSON */
    }
    throw new ApiError(body?.message || `HTTP ${res.status}`, res.status, body?.correlationId);
  }
  return text ? JSON.parse(text) : {};
}

const withBody = (method) => (path, body) =>
  request(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

export const apiGet = (path) => request(path);
export const apiPost = withBody("POST");
// PATCH: el body lleva solo los campos que cambian.
export const apiPatch = withBody("PATCH");
export const apiDelete = (path) => request(path, { method: "DELETE" });
