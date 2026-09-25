import React, { useEffect, useState } from "react";
import { apiGet } from "../api";

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

  if (estado === "cargando") return <p>Cargando...</p>;
  if (estado === "error") return <p style={{ color: "crimson" }}>Error: {error}</p>;

  return (
    <div>
      <h2>Tu plata, clara.</h2>
      <h1>₡{resumen.disponible.toLocaleString()}</h1>
      <p>Te queda para gastar</p>

      <div style={{ margin: "1rem 0" }}>
        <div style={{ background: "#eee", height: 10, borderRadius: 5 }}>
          <div
            style={{
              background: "#f2c94c",
              height: 10,
              borderRadius: 5,
              width: `${Math.min(100, (resumen.gastado / resumen.meta) * 100)}%`,
            }}
          />
        </div>
        <p>
          ₡{resumen.gastado.toLocaleString()} gastados · Meta ₡{resumen.meta.toLocaleString()}
        </p>
      </div>

      {resumen.ultimoMovimiento && (
        <div>
          <h3>Último movimiento</h3>
          <p>
            ₡{resumen.ultimoMovimiento.monto.toLocaleString()} — {resumen.ultimoMovimiento.descripcion}
          </p>
        </div>
      )}
    </div>
  );
}

export default Panel;
