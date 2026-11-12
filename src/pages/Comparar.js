import React, { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import usePagedResource from "../hooks/usePagedResource";
import PageHeader from "../components/PageHeader";
import ErrorStrip from "../components/ErrorStrip";
import Pager from "../components/Pager";
import { ListSkeleton } from "../components/Skeleton";
import Suggest from "../components/Suggest";
import { CATALOGO_PRODUCTOS } from "../catalog";
import { colones } from "../format";

const DEFAULT_QUERY = "Arroz Tío Pelón 1 kg";

const PAGE_SIZE = 5;

function Comparar() {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [busqueda, setBusqueda] = useState(DEFAULT_QUERY); // lo que se buscó de verdad

  // Una página a la vez (página base 0); el servidor ya ordena por precio.
  const params = useMemo(() => ({ producto: busqueda }), [busqueda]);
  const { data, loading, error, setPage, reload } = usePagedResource("precios", { size: PAGE_SIZE, params });

  const puedeBuscar = query.trim().length > 0;
  const buscar = (q) => setBusqueda(q.trim());

  const onSubmit = (e) => {
    e.preventDefault();
    if (!puedeBuscar) return;
    if (query.trim() === busqueda) reload();
    else buscar(query);
  };

  const lista = data?.content || [];

  return (
    <>
      <PageHeader title="Comparar" subtitle="Encontrá dónde está más barato antes de comprar" />

      <form className="card mb" onSubmit={onSubmit} noValidate>
        <label htmlFor="producto-input">
          Producto <span className="req" aria-hidden="true">*</span>
        </label>
        <div className="search-bar">
          <Suggest
            value={query}
            onChange={setQuery}
            options={CATALOGO_PRODUCTOS}
            ariaLabel="Producto"
            onPick={buscar}
            inputProps={{ id: "producto-input", required: true, "aria-required": "true" }}
          />
          <button type="submit" className="btn-primary" disabled={loading || !puedeBuscar}>
            {loading && <span className="spinner" aria-hidden="true" />}
            Buscar
          </button>
        </div>
        <p className="required-note">* Campo obligatorio para poder buscar</p>
      </form>

      <ErrorStrip error={error} onRetry={reload} retrying={loading} />

      {loading && !data ? (
        <ListSkeleton rows={4} />
      ) : data && lista.length === 0 ? (
        <p className="empty">No encontramos reportes para «{busqueda}».</p>
      ) : (
        data && (
          <>
            <p className="row-sub">{data.totalElements} tiendas con precio reportado para «{busqueda}»</p>
            <h3>Resultados · de más barato a más caro</h3>
            <div className={"stagger" + (loading ? " refreshing" : "")} key={`${data.page}-${busqueda}`} aria-busy={loading}>
              {lista.map((r, i) => (
                <div key={r.id} className={"result-row" + (data.page === 0 && i === 0 ? " best" : "")} style={{ "--i": i }}>
                  <div>
                    <strong>{r.tienda}</strong>
                    {data.page === 0 && i === 0 && <span className="tag-best">Más barato</span>}
                    <div className="row-sub">
                      <MapPin size={13} aria-hidden="true" style={{ verticalAlign: -2 }} /> {r.zona} · {r.reportes} reportes
                    </div>
                  </div>
                  <span className="leader" aria-hidden="true" />
                  <strong className="price">{colones(r.precio)}</strong>
                </div>
              ))}
            </div>
            <Pager data={data} onPage={setPage} busy={loading} noun="tiendas" />
          </>
        )
      )}
    </>
  );
}

export default Comparar;
