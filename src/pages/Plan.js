import React from "react";
import { apiGet } from "../api";
import useApi from "../hooks/useApi";
import PageHeader from "../components/PageHeader";
import ErrorState from "../components/ErrorState";
import { Skeleton } from "../components/Skeleton";
import { CategoryIcon } from "../icons";
import { colones } from "../format";

const fetchPlan = () => apiGet("plan");

function Plan() {
  const { data: plan, error, loading, reload } = useApi(fetchPlan);
  const subtitle = "Ajustá la meta de tu quincena por categoría";

  if (error) {
    return (
      <>
        <PageHeader title="Plan" subtitle={subtitle} />
        <ErrorState error={error} onRetry={reload} />
      </>
    );
  }

  if (loading || !plan) {
    return (
      <>
        <PageHeader title="Plan" subtitle={subtitle} />
        <Skeleton h={110} r={14} />
        <div className="card" style={{ marginTop: "1.25rem" }}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} h={14} style={{ marginBottom: 22 }} />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Plan" subtitle={subtitle} />

      <div className="card-hero hero-row">
        <div>
          <div className="label">META DE LA QUINCENA</div>
          <div className="amount">{colones(plan.meta)}</div>
        </div>
        <button type="button" className="btn-primary btn-light">Editar meta</button>
      </div>

      <div className="card" style={{ marginTop: "1.25rem" }}>
        <h3>Desglose por categoría</h3>
        <div className="stagger">
          {plan.categorias.map((c, i) => {
            const pct = c.presupuesto ? (c.gastado / c.presupuesto) * 100 : 0;
            return (
              <div className="plan-row" key={c.nombre} style={{ "--i": i }}>
                <div className="plan-head">
                  <span className="row-left">
                    <span className="row-icon"><CategoryIcon categoria={c.nombre} /></span>
                    <strong>{c.nombre}</strong>
                  </span>
                  <span className="row-sub">
                    {colones(c.gastado)} de {colones(c.presupuesto)} · {Math.round(pct)}%
                  </span>
                </div>
                <div
                  className="progress-track light"
                  role="progressbar"
                  aria-label={`Gasto en ${c.nombre}`}
                  aria-valuenow={Math.round(Math.min(100, pct))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className={"progress-fill green" + (pct >= 100 ? " over" : "")} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="chip">+ Agregar categoría</button>
      </div>
    </>
  );
}

export default Plan;
