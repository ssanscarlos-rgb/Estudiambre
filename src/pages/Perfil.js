import React, { useEffect, useState } from "react";
import { apiGet } from "../api";

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

  if (estado === "cargando") return <p>Cargando...</p>;
  if (estado === "error") return <p style={{ color: "crimson" }}>Error: {error}</p>;

  return (
    <div>
      <h2>Perfil</h2>
      <pre>{JSON.stringify(perfil, null, 2)}</pre>
    </div>
  );
}

export default Perfil;
