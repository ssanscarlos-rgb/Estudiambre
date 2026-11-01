import React from "react";
import { Bell, AlertTriangle } from "lucide-react";
import { Skeleton } from "./Skeleton";
import { formatFecha } from "../format";

// `notif` viene de useNotificaciones (Layout). Pagina de a 10: "Cargar más"
// agrega la siguiente página debajo, sin tapar lo ya cargado.
function NotificationsPanel({ notif, onRead, onClose }) {
  const { items, loading, error, reload, hasMore, loadMore, loadingMore, errorMore } = notif;

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

        {!loading && error && items.length === 0 && (
          <div className="dropdown-empty">
            <AlertTriangle size={18} aria-hidden="true" />
            <p>No pudimos cargar tus notificaciones.</p>
            <button type="button" className="btn-ghost" onClick={reload}>
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="dropdown-empty">
            <Bell size={18} aria-hidden="true" />
            <p>No tienes notificaciones nuevas.</p>
          </div>
        )}

        {items.map((n) => {
          const contenido = (
            <>
              <div className="notif-title">{n.titulo}</div>
              <div className="notif-msg">{n.mensaje}</div>
              <div className="notif-fecha">{formatFecha(n.fecha)}</div>
            </>
          );
          // Tocar una no leída la marca como leída (PATCH {leida: true}).
          return n.leida ? (
            <div className="notif-item" key={n.id} role="menuitem">
              {contenido}
            </div>
          ) : (
            <button
              type="button"
              className="notif-item unread"
              key={n.id}
              role="menuitem"
              title="Marcar como leída"
              onClick={() => onRead(n.id)}
            >
              {contenido}
            </button>
          );
        })}

        {errorMore && (
          <div className="notif-more-error" role="alert">
            <span>No pudimos cargar más.</span>
          </div>
        )}

        {hasMore && (
          <div className="notif-more">
            <button type="button" className="btn-ghost" disabled={loadingMore} onClick={loadMore}>
              {loadingMore ? "Cargando…" : errorMore ? "Reintentar" : "Cargar más"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default NotificationsPanel;
