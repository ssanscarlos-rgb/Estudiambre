import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";

function Registrar() {
  const [gastos, setGastos] = useState([]);
  const [estado, setEstado] = useState("cargando");
  const [error, setError] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");

  const cargarGastos = () => {
    apiGet("gastos")
      .then((data) => {
        setGastos(data);
        setEstado("ok");
      })
      .catch((err) => {
        setError(err.message);
        setEstado("error");
      });
  };

  useEffect(() => {
    cargarGastos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiPost("gastos", { descripcion, monto: Number(monto) });
      setDescripcion("");
      setMonto("");
      cargarGastos(); // como es mock, puede no reflejar el nuevo dato, pero el POST sí se prueba
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>Registrar gasto</h2>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <input
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
        />
        <input
          placeholder="Monto"
          type="number"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          required
        />
        <button type="submit">Agregar</button>
      </form>

      {estado === "cargando" && <p>Cargando...</p>}
      {estado === "error" && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {estado === "ok" && (
        <ul>
          {gastos.map((g) => (
            <li key={g.id}>
              {g.fecha} — {g.descripcion} ({g.categoria}) — ₡{g.monto.toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Registrar;
