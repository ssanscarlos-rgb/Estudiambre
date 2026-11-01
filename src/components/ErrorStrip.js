import React from "react";
import { AlertTriangle, WifiOff } from "lucide-react";
import { describeError } from "./ErrorState";

// Franja discreta para errores de CARGA: una línea con "Reintentar", sin
// reemplazar ni tapar lo que la pantalla ya muestra.
function ErrorStrip({ error, onRetry, retrying, children }) {
  if (!error) return null;
  const [title, message] = describeError(error);
  const Icon = error.status === 0 ? WifiOff : AlertTriangle;
  return (
    <div className="error-strip" role="alert">
      <Icon size={15} aria-hidden="true" />
      <span className="error-strip-text">
        <strong>{title}.</strong> {children || message}
      </span>
      {onRetry && (
        <button type="button" className="btn-ghost" disabled={retrying} onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export default ErrorStrip;
