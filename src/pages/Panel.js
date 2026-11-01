import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { apiGet } from "../api";
import useApi from "../hooks/useApi";
import PageHeader from "../components/PageHeader";
import ErrorStrip from "../components/ErrorStrip";
import { Skeleton, ListSkeleton } from "../components/Skeleton";
import AnimatedNumber from "../components/AnimatedNumber";
import { CategoryIcon } from "../icons";
import { PRODUCTO_RADAR } from "../catalog";
import { colones, formatFecha, quincenaLabel } from "../format";

const fetchResumen = () => apiGet("resumen");
// El radar ya no viene dentro de /resumen: se pide aparte a Perfil y Precios.
const fetchRadar = () => apiGet(`precios?producto=${encodeURIComponent(PRODUCTO_RADAR)}&page=0&size=3`);

function Panel() {
  const { data: r, error, loading, reload } = useApi(fetchResumen);
  const { data: radarData, error: radarError, loading: radarLoading, reload: reloadRadar } = useApi(fetchRadar);
  const { perfil, displayName } = useOutletContext();

  // Resumen (Gastos y Plan) y radar (Perfil y Precios) son servicios distintos:
  // si uno falla, el otro se sigue mostrando.
  const pct = r?.meta ? Math.min(100, (r.gastado / r.meta) * 100) : 0;
  const movimientos = r?.ultimosMovimientos || [];
  const radar = radarData?.content || [];

  return (
    <>
      <PageHeader
        title={displayName ? `Hola, ${displayName}` : "Hola"}
        subtitle={r?.quincenaLabel || quincenaLabel(perfil?.quincenaDias)}
      />
      <ErrorStrip error={error} onRetry={reload} retrying={loading} />

      {r ? (
        <div className="card-hero">
          <div className="label">DISPONIBLE ESTA QUINCENA</div>
          <div className="amount">
            ₡<AnimatedNumber value={r.disponible} />
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Porcentaje de la meta gastado"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="progress-meta">
            <span>Gastaste {colones(r.gastado)} de {colones(r.meta)}</span>
            <span>{Math.round(100 - pct)}% restante</span>
          </div>
          {r.mensaje && <div className="hero-message">{r.mensaje}</div>}
        </div>
      ) : (
        loading && <Skeleton h={200} r={14} />
      )}

      <div className="grid-2">
        <div className="card">
          <h3>Últimos movimientos</h3>
          {!r && loading && <ListSkeleton rows={3} />}
          {!r && !loading && <p className="empty">No pudimos cargar tus movimientos.</p>}
          <div className="stagger">
            {movimientos.map((m, i) => (
              <div className="list-row" key={m.id} style={{ "--i": i }}>
                <div className="row-left">
                  <div className="row-icon"><CategoryIcon categoria={m.categoria} /></div>
                  <div>
                    <div className="row-title">{m.descripcion}</div>
                    <div className="row-sub">{formatFecha(m.fecha)} · {m.categoria}</div>
                  </div>
                </div>
                <div>-{colones(m.monto)}</div>
              </div>
            ))}
          </div>
          {r && movimientos.length === 0 && <p className="empty">Aún no registras gastos esta quincena.</p>}
          <Link to="/registrar" className="link-more">Registrar un gasto →</Link>
        </div>

        <div className="card">
          <h3>Radar de precios</h3>
          <p className="row-sub" style={{ marginTop: 0 }}>{PRODUCTO_RADAR}</p>
          <ErrorStrip error={radarError} onRetry={reloadRadar} retrying={radarLoading} />
          {radarLoading && !radarData ? (
            <ListSkeleton rows={3} />
          ) : (
            <div className="stagger">
              {radar.map((p, i) => (
                <div className="list-row" key={p.id} style={{ "--i": i }}>
                  <div>
                    <div className="row-title">{p.tienda}</div>
                    <div className="row-sub">{p.zona}</div>
                  </div>
                  <div>{colones(p.precio)}</div>
                </div>
              ))}
            </div>
          )}
          {radarData && radar.length === 0 && <p className="empty">Todavía no hay precios reportados.</p>}
          <Link to="/comparar" className="link-more">Comparar más productos →</Link>
        </div>
      </div>
    </>
  );
}

export default Panel;
