import React from "react";
import { Link } from "react-router-dom";
import { Bell, AlertTriangle } from "lucide-react";
import { Skeleton } from "./Skeleton";
import { formatFecha } from "../format";
import { accionDe, infoDeTipo } from "../notificaciones";

// `notif` viene de useNotificaciones (Layout). Pagina de a 10: "Cargar más"
// agrega la siguiente página debajo, sin tapar lo ya cargado. Tocar una
// notificación la marca como leída y abre la pantalla a la que se refiere
// (`onOpen`); "Ver todas" lleva a la página de Notificaciones.
function NotificationsPanel({ notif, onOpen, onClose }) {
  const { items, loading, error, reload, hasMore, loadMore, loadingMore, errorMore } = notif;

  return (
    <>
      <div className="dropdown-backdrop" onClick={onClose} />
      <div className="dropdown-panel" role="menu" aria-label="Notificaciones">
        <div className="dropdown-header">
          <span>Notificaciones</span>
          <Link to="/notificaciones" className="dropdown-link" onClick={onClose}>
            Ver todas
          </Link>
        </div>

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
          const { Icon, nivel } = infoDeTipo(n.tipo);
          const accion = accionDe(n);
          return (
            <button
              type="button"
              className={"notif-item" + (n.leida ? "" : " unread")}
              key={n.id}
              role="menuitem"
              title={accion || (n.leida ? undefined : "Marcar como leída")}
              onClick={() => onOpen(n)}
            >
              <span className={"notif-icon " + nivel} aria-hidden="true">
                <Icon size={15} />
              </span>
              <span className="notif-body">
                <span className="notif-title">{n.titulo}</span>
                <span className="notif-msg">{n.mensaje}</span>
                <span className="notif-fecha">{formatFecha(n.fecha)}</span>
              </span>
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
