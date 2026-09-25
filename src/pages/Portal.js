import React, { useEffect, useState } from "react";
import { apiGet } from "../api";

function Portal() {
  const [datos, setDatos] = useState(null);
  const [estado, setEstado] = useState("cargando");
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("portal")
      .then((data) => {
        setDatos(data);
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
      <h2>Portal</h2>
      <pre>{JSON.stringify(datos, null, 2)}</pre>
    </div>
  );
}

export default Portal;
