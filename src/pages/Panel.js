import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../api";
import Layout from "../components/Layout";

function Panel() {
  const [resumen, setResumen] = useState(null);
  const [estado, setEstado] = useState("cargando");
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("resumen")
      .then((data) => {
        setResumen(data);
        setEstado("ok");
      })
      .catch((err) => {
        setError(err.message);
        setEstado("error");
      });
  }, []);

  return (
    <Layout title={resumen ? `Hola, ${resumen.nombre}` : "Panel"} subtitle={resumen?.quincenaLabel}>
      {estado === "cargando" && <p>Cargando...</p>}
      {estado === "error" && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {estado === "ok" && (
        <>
          <div className="card-hero">
            <div className="label">DISPONIBLE ESTA QUINCENA</div>
            <div className="amount">₡{resumen.disponible.toLocaleString()}</div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(100, (resumen.gastado / resumen.meta) * 100)}%` }}
              />
            </div>
            <div className="progress-meta">
              <span>
                Gastaste ₡{resumen.gastado.toLocaleString()} de ₡{resumen.meta.toLocaleString()}
              </span>
              <span>{Math.round(100 - (resumen.gastado / resumen.meta) * 100)}% restante</span>
            </div>
            {resumen.mensaje && <div className="hero-message">{resumen.mensaje}</div>}
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Últimos movimientos</h3>
              {resumen.ultimosMovimientos?.map((m) => (
                <div className="list-row" key={m.id}>
                  <div className="row-left">
                    <div className="row-icon">💸</div>
                    <div>
                      <div className="row-title">{m.descripcion}</div>
                      <div className="row-sub">
                        {m.fecha} · {m.categoria}
                      </div>
                    </div>
                  </div>
                  <div>-₡{m.monto.toLocaleString()}</div>
                </div>
              ))}
              <Link to="/registrar" className="link-more">
                Registrar un gasto →
              </Link>
            </div>

            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ marginTop: 0 }}>Radar de precios</h3>
              </div>
              {resumen.radarTop3?.map((p) => (
                <div className="list-row" key={p.id}>
                  <div>
                    <div className="row-title">{p.producto}</div>
                    <div className="row-sub">{p.tienda}</div>
                  </div>
                  <div>₡{p.precio.toLocaleString()}</div>
                </div>
              ))}
              <Link to="/comparar" className="link-more">
                Comparar más productos →
              </Link>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

export default Panel;
