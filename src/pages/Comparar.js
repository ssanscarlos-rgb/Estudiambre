import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ListPlus, ListChecks, Check, Trash2, Receipt } from "lucide-react";
import { useAuth } from "../auth";
import usePagedResource from "../hooks/usePagedResource";
import PageHeader from "../components/PageHeader";
import ErrorStrip from "../components/ErrorStrip";
import Pager from "../components/Pager";
import { ListSkeleton } from "../components/Skeleton";
import Suggest from "../components/Suggest";
import { CATALOGO_PRODUCTOS } from "../catalog";
import { colones } from "../format";
import { leerLista, guardarLista, idItem, totalLista, descripcionDeCompra } from "../lista";

const DEFAULT_QUERY = "Arroz Tío Pelón 1 kg";

const PAGE_SIZE = 5;

function Comparar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const email = user?.email;

  // Lista de compras (se guarda en este navegador).
  const [lista, setLista] = useState(() => leerLista(email));
  useEffect(() => {
    guardarLista(email, lista);
  }, [email, lista]);
  const enLista = (producto, tienda) => lista.some((i) => idItem(i.producto, i.tienda) === idItem(producto, tienda));
  const agregar = (r) =>
    setLista((prev) =>
      prev.some((i) => idItem(i.producto, i.tienda) === idItem(busqueda, r.tienda))
        ? prev
        : [...prev, { producto: busqueda, tienda: r.tienda, zona: r.zona, precio: r.precio, cantidad: 1 }]
    );
  const quitar = (it) => setLista((prev) => prev.filter((i) => idItem(i.producto, i.tienda) !== idItem(it.producto, it.tienda)));
  const cambiarCantidad = (it, delta) =>
    setLista((prev) =>
      prev.map((i) =>
        idItem(i.producto, i.tienda) === idItem(it.producto, it.tienda)
          ? { ...i, cantidad: Math.min(99, Math.max(1, i.cantidad + delta)) }
          : i
      )
    );

  // Registrar directo: abre Registrar con los datos ya puestos.
  const registrar = (descripcion, monto, origen) =>
    navigate(`/registrar?${new URLSearchParams({ descripcion, monto: String(monto), ...(origen ? { origen } : {}) })}`);
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

  const resultados = data?.content || [];
  const masBarato = data?.page === 0 && resultados.length ? resultados[0].precio : null;

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

      {lista.length > 0 && (
        <section className="card lista-compras" aria-label="Lista de compras">
          <div className="lista-head">
            <h3>
              <ListChecks size={17} aria-hidden="true" style={{ verticalAlign: -3, marginRight: 6 }} />
              Mi lista de compras · {lista.length} {lista.length === 1 ? "producto" : "productos"}
            </h3>
            <button type="button" className="btn-small" onClick={() => setLista([])}>
              Vaciar lista
            </button>
          </div>
          {lista.map((it) => (
            <div className="lista-item" key={idItem(it.producto, it.tienda)}>
              <div>
                <strong>{it.producto}</strong>
                <div className="row-sub">
                  {it.tienda} · {colones(it.precio)} c/u
                </div>
              </div>
              <div className="qty" role="group" aria-label={`Cantidad de ${it.producto}`}>
                <button type="button" aria-label="Menos" disabled={it.cantidad <= 1} onClick={() => cambiarCantidad(it, -1)}>−</button>
                <span aria-live="polite">{it.cantidad}</span>
                <button type="button" aria-label="Más" disabled={it.cantidad >= 99} onClick={() => cambiarCantidad(it, 1)}>+</button>
              </div>
              <strong>{colones(it.precio * it.cantidad)}</strong>
              <button type="button" className="row-icon-btn danger" aria-label={`Quitar ${it.producto} de la lista`} onClick={() => quitar(it)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <div className="lista-total">
            <span>Total estimado</span>
            <span>{colones(totalLista(lista))}</span>
          </div>
          <div className="lista-acciones">
            <button
              type="button"
              className="btn-primary"
              onClick={() => registrar(descripcionDeCompra(lista), totalLista(lista), "lista")}
            >
              Registrar compra
            </button>
          </div>
        </section>
      )}

      <ErrorStrip error={error} onRetry={reload} retrying={loading} />

      {loading && !data ? (
        <ListSkeleton rows={4} />
      ) : data && resultados.length === 0 ? (
        <p className="empty">No encontramos reportes para «{busqueda}».</p>
      ) : (
        data && (
          <>
            <p className="row-sub">{data.totalElements} tiendas con precio reportado para «{busqueda}»</p>
            <h3>Resultados · de más barato a más caro</h3>
            <div className={"stagger" + (loading ? " refreshing" : "")} key={`${data.page}-${busqueda}`} aria-busy={loading}>
              {resultados.map((r, i) => (
                <div key={r.id} className={"result-row con-acciones" + (data.page === 0 && i === 0 ? " best" : "")} style={{ "--i": i }}>
                  <div>
                    <strong>{r.tienda}</strong>
                    {data.page === 0 && i === 0 && <span className="tag-best">Más barato</span>}
                    <div className="row-sub">
                      <MapPin size={13} aria-hidden="true" style={{ verticalAlign: -2 }} /> {r.zona} · {r.reportes} reportes
                    </div>
                  </div>
                  <span className="leader" aria-hidden="true" />
                  <strong className="price">{colones(r.precio)}</strong>
                  <div className="result-actions" style={{ flexBasis: "100%" }}>
                    {masBarato !== null && r.precio > masBarato && (
                      <span className="row-sub">+{colones(r.precio - masBarato)} que la más barata</span>
                    )}
                    <button
                      type="button"
                      className="btn-small"
                      disabled={enLista(busqueda, r.tienda)}
                      onClick={() => agregar(r)}
                      aria-label={`Agregar ${busqueda} de ${r.tienda} a la lista`}
                    >
                      {enLista(busqueda, r.tienda) ? <Check size={13} aria-hidden="true" /> : <ListPlus size={13} aria-hidden="true" />}
                      {enLista(busqueda, r.tienda) ? "En la lista" : "A la lista"}
                    </button>
                    <button
                      type="button"
                      className="btn-small primary"
                      onClick={() => registrar(`${busqueda} · ${r.tienda}`, r.precio)}
                      aria-label={`Registrar gasto de ${busqueda} en ${r.tienda}`}
                    >
                      <Receipt size={13} aria-hidden="true" /> Registrar gasto
                    </button>
                  </div>
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
