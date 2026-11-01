import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { describeError } from "./ErrorState";

// Avisos que se descartan solos y no tapan nada. Sirven para el resultado
// de una acción (guardar, borrar, editar). Los errores de carga de una
// pantalla usan <ErrorStrip> en su lugar.
const ToastContext = createContext(null);
const MAX_VISIBLES = 3;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, kind) => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLES - 1)), { id, message, kind }]);
      timers.current.set(id, setTimeout(() => dismiss(id), kind === "error" ? 6000 : 3000));
    },
    [dismiss]
  );

  useEffect(() => {
    const pendientes = timers.current;
    return () => pendientes.forEach(clearTimeout);
  }, []);

  const api = useMemo(
    () => ({
      success: (message) => push(message, "success"),
      // error(err, "No se pudo guardar el gasto") → "No se pudo guardar el gasto. <causa>"
      error: (err, accion) => {
        const causa = describeError(err)[1];
        push(accion ? `${accion}. ${causa}` : causa, "error");
      },
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region">
        {toasts.map((t) => (
          <div key={t.id} className={"toast" + (t.kind === "error" ? " error" : "")} role={t.kind === "error" ? "alert" : "status"}>
            {t.kind === "error" ? <AlertTriangle size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
            <span className="toast-text">{t.message}</span>
            <button type="button" className="toast-close" aria-label="Cerrar aviso" onClick={() => dismiss(t.id)}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
