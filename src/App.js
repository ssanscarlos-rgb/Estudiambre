import React, { useEffect, useState } from "react";

function App() {
  const [productos, setProductos] = useState([]);
  const [estado, setEstado] = useState("cargando"); // cargando | ok | error
  const [detalleError, setDetalleError] = useState("");

  useEffect(() => {
    const url = process.env.REACT_APP_API_URL;
    const key = process.env.REACT_APP_API_KEY;

    if (!url) {
      setEstado("error");
      setDetalleError(
        "Falta REACT_APP_API_URL. Revisa las variables del ambiente en GitHub."
      );
      return;
    }

    fetch(url, {
      headers: {
        "Ocp-Apim-Subscription-Key": key || "",
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setProductos(data);
        setEstado("ok");
      })
      .catch((err) => {
        setEstado("error");
        setDetalleError(err.message);
      });
  }, []);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      <h1 style={{ textAlign: "center" }}>Productos</h1>

      {estado === "cargando" && (
        <p style={{ textAlign: "center" }}>Cargando...</p>
      )}

      {estado === "error" && (
        <p style={{ textAlign: "center", color: "crimson" }}>
          Error al obtener los datos: {detalleError}
          <br />
          Revisa la consola del navegador (F12) para más detalle (CORS,
          variables de ambiente, etc).
        </p>
      )}

      {estado === "ok" && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "center",
          }}
        >
          {productos.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "1rem",
                width: "200px",
                textAlign: "center",
              }}
            >
              {p.image && (
                <img
                  src={p.image}
                  alt={p.title}
                  style={{ maxWidth: "100%", height: "120px", objectFit: "contain" }}
                />
              )}
              <h3>{p.title}</h3>
              <p>${p.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
