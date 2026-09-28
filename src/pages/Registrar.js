import React, { useEffect, useState } from "react";
import { apiGet, apiPost } from "../api";
import Layout from "../components/Layout";

const CATEGORIAS = ["Comida", "Transporte", "Servicios", "Estudio", "Antojos", "Otros"];

function Registrar() {
  const [gastos, setGastos] = useState([]);
  const [estado, setEstado] = useState("cargando");
  const [error, setError] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("Comida");
  const [toast, setToast] = useState("");

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
      await apiPost("gastos", { descripcion, monto: Number(monto), categoria });
      setToast(`Gasto guardado · ${descripcion}`);
      setTimeout(() => setToast(""), 3000);
      setDescripcion("");
      setMonto("");
      cargarGastos();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Layout title="Registrar" subtitle="Anotá un gasto en menos de 15 segundos">
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ marginTop: 0 }}>Nuevo gasto</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Ej. Almuerzo en la soda"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              style={{ flex: 1 }}
              required
            />
            <input
              type="number"
              placeholder="₡ 0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              style={{ width: 140 }}
              required
            />
          </div>

          <div className="chip-group">
            {CATEGORIAS.map((c) => (
              <button
                type="button"
                key={c}
                className={"chip" + (categoria === c ? " selected" : "")}
                onClick={() => setCategoria(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <button type="submit" className="btn-primary">
            Guardar gasto
          </button>
          <p className="row-sub" style={{ marginTop: "0.75rem" }}>
            Al guardar verás una confirmación y la barra del Panel se actualiza al instante.
          </p>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Historial reciente</h3>
        {estado === "cargando" && <p>Cargando...</p>}
        {estado === "error" && <p style={{ color: "crimson" }}>Error: {error}</p>}
        {estado === "ok" &&
          gastos.map((g) => (
            <div className="list-row" key={g.id}>
              <div className="row-left">
                <div className="row-icon">💸</div>
                <div>
                  <div className="row-title">{g.descripcion}</div>
                  <div className="row-sub">
                    {g.fecha} · {g.categoria}
                  </div>
                </div>
              </div>
              <div>-₡{g.monto.toLocaleString()}</div>
            </div>
          ))}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </Layout>
  );
}

export default Registrar;
