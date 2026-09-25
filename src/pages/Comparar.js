import React, { useEffect, useState } from "react";
import { apiGet } from "../api";

function Comparar() {
  const [precios, setPrecios] = useState([]);
  const [estado, setEstado] = useState("cargando");
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("precios")
      .then((data) => {
        setPrecios(data);
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
      <h2>Radar de precios</h2>
      {precios.map((p, i) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0.75rem",
            background: i === 0 ? "#f2c94c33" : "transparent",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <strong>{p.tienda}</strong>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#666" }}>
              {p.zona} · {p.reportes} reportes
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <strong>₡{p.precio.toLocaleString()}</strong>
            {i === 0 && <p style={{ margin: 0, fontSize: "0.75rem", color: "#c0392b" }}>MÁS BARATO</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Comparar;
