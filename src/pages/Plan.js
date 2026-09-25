import React, { useEffect, useState } from "react";
import { apiGet } from "../api";

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

  if (estado === "cargando") return <p>Cargando...</p>;
  if (estado === "error") return <p style={{ color: "crimson" }}>Error: {error}</p>;

  return (
    <div>
      <h2>Plan de la quincena</h2>
      <p>Meta: ₡{plan.meta?.toLocaleString()}</p>
      {plan.categorias && (
        <ul>
          {plan.categorias.map((c) => (
            <li key={c.nombre}>
              {c.nombre}: ₡{c.presupuesto.toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Plan;
