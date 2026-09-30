const BASE_URL = process.env.REACT_APP_API_URL;

// El token lo setea auth.js apenas Google confirma la sesión. Se guarda
// como variable de módulo (no en React state) para que cualquier llamada
// a apiGet/apiPost, incluso fuera de un componente, use siempre el token
// más reciente sin tener que pasarlo como parámetro en cada lugar.
let authToken = null;
export function setAuthToken(token) {
  authToken = token;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/${path}`, {
      ...options,
      headers: {
        Authorization: authToken ? `Bearer ${authToken}` : "",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new ApiError("network", 0);
  }
  if (!res.ok) throw new ApiError(`HTTP ${res.status}`, res.status);
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

export const apiGet = (path) => request(path);
export const apiPost = (path, body) =>
  request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
