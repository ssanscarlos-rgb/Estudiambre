import React from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { Skeleton } from "./Skeleton";

function NotificationsPanel({ data, loading, error, onRetry, onClose }) {
  const items = data || [];

  return (
    <>
      <div className="dropdown-backdrop" onClick={onClose} />
      <div className="dropdown-panel" role="menu" aria-label="Notificaciones">
        <div className="dropdown-header">Notificaciones</div>

        {loading && (
          <div style={{ padding: "0.75rem 1rem" }}>
            <Skeleton h={12} w="70%" />
            <Skeleton h={10} w="90%" style={{ marginTop: 8 }} />
          </div>
        )}

        {error && (
          <div className="dropdown-empty">
            <AlertTriangle size={18} aria-hidden="true" />
            <p>No pudimos cargar tus notificaciones.</p>
            {onRetry && (
              <button type="button" className="btn-ghost" onClick={onRetry}>
                Reintentar
              </button>
            )}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="dropdown-empty">
            <Bell size={18} aria-hidden="true" />
            <p>No tienes notificaciones nuevas.</p>
          </div>
        )}

        {!loading &&
          !error &&
          items.map((n) => (
            <div className={"notif-item" + (n.leida ? "" : " unread")} key={n.id} role="menuitem">
              <div className="notif-title">{n.titulo}</div>
              <div className="notif-msg">{n.mensaje}</div>
              <div className="notif-fecha">{n.fecha}</div>
            </div>
          ))}
      </div>
    </>
  );
}

export default NotificationsPanel;
