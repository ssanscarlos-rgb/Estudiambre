import React, { useState } from "react";
import { apiGet } from "../api";
import Layout from "../components/Layout";

function Comparar() {
  const [query, setQuery] = useState("Arroz Tío Pelón 1 kg");
  const [resultado, setResultado] = useState(null);
  const [estado, setEstado] = useState("idle");
  const [error, setError] = useState("");

  const buscar = (e) => {
    e.preventDefault();
    setEstado("cargando");
    apiGet(`precios?producto=${encodeURIComponent(query)}`)
      .then((data) => {
        setResultado(data);
        setEstado("ok");
      })
      .catch((err) => {
        setError(err.message);
        setEstado("error");
      });
  };

  return (
    <Layout title="Comparar" subtitle="Encontrá dónde está más barato antes de comprar">
      <form onSubmit={buscar} className="card" style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn-primary">
          Buscar
        </button>
      </form>

      {estado === "cargando" && <p>Buscando...</p>}
      {estado === "error" && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {estado === "ok" && resultado && (
        <>
          <p className="subtitle">{resultado.totalReportes} reportes de estudiantes en los últimos 15 días</p>
          <h3>Resultados · de más barato a más caro</h3>
          {resultado.resultados.map((r, i) => (
            <div key={r.id} className={"result-row" + (i === 0 ? " best" : "")}>
              <div>
                <strong>{r.tienda}</strong>
                {i === 0 && <span className="tag-best">MÁS BARATO</span>}
                <div className="row-sub">
                  {r.zona} · {r.reportes} reportes
                </div>
              </div>
              <strong>₡{r.precio.toLocaleString()}</strong>
            </div>
          ))}
        </>
      )}
    </Layout>
  );
}

export default Comparar;
