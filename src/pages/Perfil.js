import React, { useEffect, useState } from "react";
import { apiGet } from "../api";
import Layout from "../components/Layout";

function Perfil() {
  const [perfil, setPerfil] = useState(null);
  const [estado, setEstado] = useState("cargando");
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("perfil")
      .then((data) => {
        setPerfil(data);
        setEstado("ok");
      })
      .catch((err) => {
        setError(err.message);
        setEstado("error");
      });
  }, []);

  return (
    <Layout title="Perfil" subtitle="Tus datos y preferencias">
      {estado === "cargando" && <p>Cargando...</p>}
      {estado === "error" && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {estado === "ok" && (
        <>
          <div className="card" style={{ marginBottom: "1.25rem", display: "flex", gap: "1rem", alignItems: "center" }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: "1.2rem" }}>
              {perfil.nombre?.split(" ").slice(0, 2).map((p) => p[0]).join("")}
            </div>
            <div>
              <strong>{perfil.nombre}</strong>
              <div className="row-sub">{perfil.correo}</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="row-sub">UNIVERSIDAD</div>
              <strong>{perfil.universidad}</strong>
            </div>
            <div className="card">
              <div className="row-sub">QUINCENA</div>
              <strong>{perfil.quincenaDias}</strong>
            </div>
          </div>

          <div className="card" style={{ marginTop: "1.25rem" }}>
            <h3 style={{ marginTop: 0 }}>Insignias obtenidas</h3>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {perfil.insignias?.map((i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--accent-orange-bg)",
                    borderRadius: 10,
                    padding: "0.75rem 1rem",
                    fontSize: "0.85rem",
                  }}
                >
                  🏅 {i}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}

export default Perfil;
