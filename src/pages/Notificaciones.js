import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { ArrowRight, Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import usePagedResource from "../hooks/usePagedResource";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import ErrorStrip from "../components/ErrorStrip";
import Pager from "../components/Pager";
import { ListSkeleton } from "../components/Skeleton";
import { formatFecha } from "../format";
import { accionDe, destinoDe, infoDeTipo } from "../notificaciones";

const SIZE = 10;

// Página propia de notificaciones: historial completo (nuevas y pasadas) paginado
// desde el servidor, con filtro "Sin leer", marcar como leída, eliminar y un botón
// que lleva a la pantalla a la que se refiere cada aviso. `notif` es el estado de la
// campana (Layout): marcar o eliminar aquí también lo actualiza allá.
function Notificaciones() {
  const { notif } = useOutletContext();
  const toast = useToast();
  const navigate = useNavigate();

  const [filtro, setFiltro] = useState("todas");
  const [confirmarId, setConfirmarId] = useState(null);
  const [ocupadoId, setOcupadoId] = useState(null);
  const [hayNuevas, setHayNuevas] = useState(false);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const { data, setData, loading, error, page, setPage, reload } = usePagedResource("notificaciones", {
    size: SIZE,
    params: { leida: filtro === "sin-leer" ? "false" : undefined },
  });

  // Tiempo real: si estás en la primera página la lista se refresca sola;
  // si estás en otra, un aviso te deja volver a la primera sin perder tu lugar.
  const llegadaVista = useRef(notif.llegada?.k);
  useEffect(() => {
    if (!notif.llegada || notif.llegada.k === llegadaVista.current) return;
    llegadaVista.current = notif.llegada.k;
    if (page === 0) reload();
    else setHayNuevas(true);
  }, [notif.llegada, page, reload]);

  const verNuevas = () => {
    setHayNuevas(false);
    if (page === 0) reload();
    else setPage(0);
  };

  const cambiarFiltro = (f) => {
    setFiltro(f);
    setConfirmarId(null);
    setHayNuevas(false);
  };

  const contenido = data?.content ?? [];
  // El servidor filtra por `leida`; si no lo soportara, aquí también se descartan las leídas.
  const visibles = filtro === "sin-leer" ? contenido.filter((n) => !n.leida) : contenido;
  const sinLeer = contenido.filter((n) => !n.leida);

  const cambiarLocal = (id, cambio) =>
    setData((d) => (d ? { ...d, content: d.content.map((n) => (n.id === id ? { ...n, ...cambio } : n)) } : d));

  const marcarLeida = async (n) => {
    if (n.leida) return true;
    cambiarLocal(n.id, { leida: true });
    try {
      await notif.markRead(n.id);
      return true;
    } catch (e) {
      cambiarLocal(n.id, { leida: false });
      toast.error(e, "No se pudo marcar como leída");
      return false;
    }
  };

  const abrir = async (n) => {
    const destino = destinoDe(n);
    if (destino) navigate(destino);
    marcarLeida(n);
  };

  const marcarPagina = async () => {
    setMarcandoTodas(true);
    const resultados = await Promise.all(sinLeer.map(marcarLeida));
    setMarcandoTodas(false);
    if (resultados.every(Boolean)) toast.success("Marcaste las notificaciones de esta página como leídas");
  };

  const eliminar = async (n) => {
    setOcupadoId(n.id);
    try {
      await notif.remove(n.id);
      setConfirmarId(null);
      toast.success("Notificación eliminada");
      reload(); // vuelve a llenar la página y recalcula el total
    } catch (e) {
      toast.error(e, "No se pudo eliminar la notificación");
    } finally {
      setOcupadoId(null);
    }
  };

  return (
    <>
      <PageHeader title="Notificaciones" subtitle="Tus avisos de presupuesto, los nuevos y los anteriores" />

      <div className="notif-toolbar">
        <div className="segmented" role="group" aria-label="Filtrar notificaciones">
          <button
            type="button"
            className={filtro === "todas" ? "on" : ""}
            aria-pressed={filtro === "todas"}
            onClick={() => cambiarFiltro("todas")}
          >
            Todas
          </button>
          <button
            type="button"
            className={filtro === "sin-leer" ? "on" : ""}
            aria-pressed={filtro === "sin-leer"}
            onClick={() => cambiarFiltro("sin-leer")}
          >
            Sin leer
          </button>
        </div>
        <button type="button" className="btn-ghost" disabled={sinLeer.length === 0 || marcandoTodas} onClick={marcarPagina}>
          <CheckCheck size={14} aria-hidden="true" style={{ marginRight: 6, verticalAlign: -2 }} />
          Marcar esta página como leída
        </button>
      </div>

      {hayNuevas && (
        <div className="notif-nuevas" role="status">
          <Bell size={15} aria-hidden="true" />
          <span>Llegaron notificaciones nuevas.</span>
          <button type="button" className="btn-ghost" onClick={verNuevas}>
            Verlas
          </button>
        </div>
      )}

      <ErrorStrip error={error} onRetry={reload} retrying={loading} />

      {loading && !data ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          {data && visibles.length === 0 && (
            <div className="card empty-card">
              <Bell size={22} aria-hidden="true" />
              <p>
                {filtro === "sin-leer"
                  ? "No tienes notificaciones sin leer."
                  : "Todavía no tienes notificaciones. Te avisamos cuando una categoría llegue al 80% de su presupuesto."}
              </p>
            </div>
          )}

          <ul className={"notif-list" + (loading ? " refreshing" : "")} aria-busy={loading}>
            {visibles.map((n) => {
              const { Icon, nivel } = infoDeTipo(n.tipo);
              const accion = accionDe(n);
              const confirmando = confirmarId === n.id;
              return (
                <li key={n.id} className={"notif-card" + (n.leida ? "" : " unread")}>
                  <span className={"notif-icon grande " + nivel} aria-hidden="true">
                    <Icon size={18} />
                  </span>

                  <div className="notif-card-body">
                    <div className="notif-card-head">
                      <strong className="notif-title">{n.titulo}</strong>
                      {!n.leida && <span className="tag-new">Nueva</span>}
                    </div>
                    <p className="notif-msg">{n.mensaje}</p>
                    <div className="notif-fecha">{formatFecha(n.fecha)}</div>
                    {accion && (
                      <button type="button" className="link-btn" onClick={() => abrir(n)}>
                        {accion} <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="notif-actions">
                    {confirmando ? (
                      <>
                        <span className="row-sub">¿Eliminar?</span>
                        <button
                          type="button"
                          className="row-icon-btn danger"
                          aria-label="Confirmar eliminación"
                          disabled={ocupadoId === n.id}
                          onClick={() => eliminar(n)}
                        >
                          {ocupadoId === n.id ? <span className="spinner" aria-hidden="true" /> : <Check size={14} />}
                        </button>
                        <button
                          type="button"
                          className="row-icon-btn"
                          aria-label="Cancelar eliminación"
                          onClick={() => setConfirmarId(null)}
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        {!n.leida && (
                          <button
                            type="button"
                            className="row-icon-btn"
                            aria-label={`Marcar como leída: ${n.titulo}`}
                            title="Marcar como leída"
                            onClick={() => marcarLeida(n)}
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          className="row-icon-btn danger"
                          aria-label={`Eliminar: ${n.titulo}`}
                          title="Eliminar"
                          onClick={() => setConfirmarId(n.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <Pager data={data} onPage={setPage} busy={loading} noun="notificaciones" />
        </>
      )}
    </>
  );
}

export default Notificaciones;
