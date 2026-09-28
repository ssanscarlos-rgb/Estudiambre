import React from "react";
import { AlertTriangle, WifiOff } from "lucide-react";

const MESSAGES = {
  0: ["Sin conexión", "No pudimos comunicarnos con el servidor. Revisa tu conexión e intenta de nuevo."],
  400: ["Datos inválidos", "Algo de lo que enviaste no es válido. Revisa la información e intenta otra vez."],
  401: ["Sin acceso", "No tienes permiso para ver esto."],
  403: ["Sin acceso", "No tienes permiso para ver esto."],
  404: ["No encontrado", "No encontramos lo que buscabas."],
  429: ["Demasiados intentos", "Espera unos segundos antes de intentar de nuevo."],
};

export function describeError(error) {
  const status = error?.status;
  if (MESSAGES[status]) return MESSAGES[status];
  if (status >= 500) return ["Problema del servidor", "Algo falló de nuestro lado. Intenta de nuevo en unos segundos."];
  return ["Algo salió mal", "Ocurrió un error inesperado. Intenta de nuevo."];
}

function ErrorState({ error, onRetry, compact, children }) {
  const [title, message] = describeError(error);
  const Icon = error?.status === 0 ? WifiOff : AlertTriangle;
  return (
    <div className={"error-state" + (compact ? " compact" : "")} role="alert">
      <Icon size={22} className="error-icon" aria-hidden="true" />
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
        <div className="error-actions">
          {onRetry && (
            <button type="button" className="btn-primary" onClick={onRetry}>
              Reintentar
            </button>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export default ErrorState;
