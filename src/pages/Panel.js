import React from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api";
import useApi from "../hooks/useApi";
import PageHeader from "../components/PageHeader";
import ErrorState from "../components/ErrorState";
import { Skeleton, ListSkeleton } from "../components/Skeleton";
import AnimatedNumber from "../components/AnimatedNumber";
import { CategoryIcon } from "../icons";
import { colones } from "../format";

const fetchResumen = () => apiGet("resumen");

function Panel() {
  const { data: r, error, loading, reload } = useApi(fetchResumen);

  if (error) {
    return (
      <>
        <PageHeader title="Panel" />
        <ErrorState error={error} onRetry={reload} />
      </>
    );
  }

  if (loading || !r) {
    return (
      <>
        <PageHeader title="Panel" subtitle="Cargando tu quincena…" />
        <Skeleton h={200} r={14} />
        <div className="grid-2">
          <div className="card"><ListSkeleton /></div>
          <div className="card"><ListSkeleton /></div>
        </div>
      </>
    );
  }

  const pct = r.meta ? Math.min(100, (r.gastado / r.meta) * 100) : 0;
  const movimientos = r.ultimosMovimientos || [];
  const radar = r.radarTop3 || [];

  return (
    <>
      <PageHeader title={`Hola, ${r.nombre}`} subtitle={r.quincenaLabel} />

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

      <div className="grid-2">
        <div className="card">
          <h3>Últimos movimientos</h3>
          <div className="stagger">
            {movimientos.map((m, i) => (
              <div className="list-row" key={m.id} style={{ "--i": i }}>
                <div className="row-left">
                  <div className="row-icon"><CategoryIcon categoria={m.categoria} /></div>
                  <div>
                    <div className="row-title">{m.descripcion}</div>
                    <div className="row-sub">{m.fecha} · {m.categoria}</div>
                  </div>
                </div>
                <div>-{colones(m.monto)}</div>
              </div>
            ))}
          </div>
          {movimientos.length === 0 && <p className="empty">Aún no registras gastos esta quincena.</p>}
          <Link to="/registrar" className="link-more">Registrar un gasto →</Link>
        </div>

        <div className="card">
          <h3>Radar de precios</h3>
          <div className="stagger">
            {radar.map((p, i) => (
              <div className="list-row" key={p.id} style={{ "--i": i }}>
                <div>
                  <div className="row-title">{p.producto}</div>
                  <div className="row-sub">{p.tienda}</div>
                </div>
                <div>{colones(p.precio)}</div>
              </div>
            ))}
          </div>
          {radar.length === 0 && <p className="empty">Todavía no hay precios reportados.</p>}
          <Link to="/comparar" className="link-more">Comparar más productos →</Link>
        </div>
      </div>
    </>
  );
}

export default Panel;
