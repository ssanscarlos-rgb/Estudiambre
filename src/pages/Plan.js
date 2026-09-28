import React, { useEffect, useState } from "react";
import { apiGet } from "../api";
import Layout from "../components/Layout";

function Plan() {
  const [plan, setPlan] = useState(null);
  const [estado, setEstado] = useState("cargando");
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("plan")
      .then((data) => {
        setPlan(data);
        setEstado("ok");
      })
      .catch((err) => {
        setError(err.message);
        setEstado("error");
      });
  }, []);

  return (
    <Layout title="Plan" subtitle="Ajustá la meta de tu quincena por categoría">
      {estado === "cargando" && <p>Cargando...</p>}
      {estado === "error" && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {estado === "ok" && (
        <>
          <div className="card-hero" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div className="label">META DE LA QUINCENA</div>
              <div className="amount" style={{ marginBottom: 0 }}>₡{plan.meta.toLocaleString()}</div>
            </div>
            <button className="btn-primary" style={{ background: "white", color: "var(--accent-green)" }}>
              Editar meta
            </button>
          </div>

          <div className="card" style={{ marginTop: "1.25rem" }}>
            <h3 style={{ marginTop: 0 }}>Desglose por categoría</h3>
            {plan.categorias.map((c) => (
              <div key={c.nombre} style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                  <strong>{c.nombre}</strong>
                  <span className="row-sub">
                    ₡{c.gastado.toLocaleString()} de ₡{c.presupuesto.toLocaleString()}
                  </span>
                </div>
                <div className="progress-track light">
                  <div
                    className="progress-fill green"
                    style={{ width: `${Math.min(100, (c.gastado / c.presupuesto) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <button className="chip">+ Agregar categoría</button>
          </div>
        </>
      )}
    </Layout>
  );
}

export default Plan;
