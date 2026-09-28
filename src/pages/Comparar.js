import React, { useCallback, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { apiGet } from "../api";
import PageHeader from "../components/PageHeader";
import ErrorState from "../components/ErrorState";
import { ListSkeleton } from "../components/Skeleton";
import { colones } from "../format";

const DEFAULT_QUERY = "Arroz Tío Pelón 1 kg";

function Comparar() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [busqueda, setBusqueda] = useState(DEFAULT_QUERY);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const buscar = useCallback((q) => {
    setLoading(true);
    setError(null);
    setBusqueda(q);
    apiGet(`precios?producto=${encodeURIComponent(q)}`)
      .then(setResultado)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    buscar(DEFAULT_QUERY);
  }, [buscar]);

  const puedeBuscar = query.trim().length > 0;

  const onSubmit = (e) => {
    e.preventDefault();
    if (!puedeBuscar) return;
    buscar(query.trim());
  };

  const lista = [...(resultado?.resultados || [])].sort((a, b) => a.precio - b.precio);

  return (
    <>
      <PageHeader title="Comparar" subtitle="Encontrá dónde está más barato antes de comprar" />

      <form className="card mb" onSubmit={onSubmit} noValidate>
        <label htmlFor="producto-input">
          Producto <span className="req" aria-hidden="true">*</span>
        </label>
        <div className="search-bar">
          <input
            id="producto-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
            aria-required="true"
          />
          <button type="submit" className="btn-primary" disabled={loading || !puedeBuscar}>
            {loading && <span className="spinner" aria-hidden="true" />}
            Buscar
          </button>
        </div>
        <p className="required-note">* Campo obligatorio para poder buscar</p>
      </form>

      {error ? (
        <ErrorState error={error} onRetry={() => buscar(busqueda)} />
      ) : loading ? (
        <ListSkeleton rows={4} />
      ) : lista.length === 0 ? (
        <p className="empty">No encontramos reportes para «{busqueda}».</p>
      ) : (
        <>
          <p className="row-sub">{resultado.totalReportes} reportes de estudiantes en los últimos 15 días</p>
          <h3>Resultados · de más barato a más caro</h3>
          <div className="stagger">
            {lista.map((r, i) => (
              <div key={r.id} className={"result-row" + (i === 0 ? " best" : "")} style={{ "--i": i }}>
                <div>
                  <strong>{r.tienda}</strong>
                  {i === 0 && <span className="tag-best">MÁS BARATO</span>}
                  <div className="row-sub">
                    <MapPin size={13} aria-hidden="true" style={{ verticalAlign: -2 }} /> {r.zona} · {r.reportes} reportes
                  </div>
                </div>
                <strong>{colones(r.precio)}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default Comparar;
