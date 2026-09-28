const BASE_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

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
      headers: { "Ocp-Apim-Subscription-Key": API_KEY || "", ...(options.headers || {}) },
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
