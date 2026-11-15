import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
const CLAVE_MODO = "estudiambre_modo_paginacion";
const leerModo = () => {
  try {
    return localStorage.getItem(CLAVE_MODO) === "deslizar" ? "deslizar" : "paginas";
  } catch {
    return "paginas";
  }
};

const normalizar = (t) => (t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

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
  // El servidor busca por palabras ("arroz" encuentra "Arroz Tío Pelón 1 kg"): cada fila trae su producto.
  const nombreDe = (r) => r.producto || busqueda;
  const agregar = (r) =>
    setLista((prev) =>
      prev.some((i) => idItem(i.producto, i.tienda) === idItem(nombreDe(r), r.tienda))
        ? prev
        : [...prev, { producto: nombreDe(r), tienda: r.tienda, zona: r.zona, precio: r.precio, cantidad: 1 }]
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

  // Modo de paginación: "paginas" (botones) o "deslizar" (la rueda/el scroll dentro del listado va
  // trayendo la página siguiente). En los dos casos el servidor entrega una página a la vez.
  const [modo, setModo] = useState(leerModo);
  const [acum, setAcum] = useState([]); // filas ya cargadas en modo "deslizar"
  const caja = useRef(null);
  const cambiarModo = (m) => {
    if (m === modo) return;
    setModo(m);
    setAcum([]);
    setPage(0);
    try {
      localStorage.setItem(CLAVE_MODO, m);
    } catch {
      /* sin acceso a localStorage */
    }
  };
  useEffect(() => {
    if (modo !== "deslizar" || !data) return;
    setAcum((prev) => {
      if (data.page === 0) return data.content;
      const ya = new Set(prev.map((r) => r.id));
      return [...prev, ...data.content.filter((r) => !ya.has(r.id))];
    });
  }, [data, modo]);
  const hayMas = !!data && data.page + 1 < (data.totalPages || 1);
  const cargarMas = useCallback(() => {
    if (modo === "deslizar" && data && !loading && data.page + 1 < (data.totalPages || 1)) setPage(data.page + 1);
  }, [modo, data, loading, setPage]);
  const alDeslizar = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 60) cargarMas();
  };
  // Si lo cargado no llena el espacio (no habría nada que deslizar), se sigue pidiendo.
  useEffect(() => {
    const el = caja.current;
    if (modo === "deslizar" && el && acum.length && el.scrollHeight <= el.clientHeight + 4) cargarMas();
  }, [acum, modo, cargarMas]);

  const puedeBuscar = query.trim().length > 0;
  const buscar = (q) => setBusqueda(q.trim());

  const onSubmit = (e) => {
    e.preventDefault();
    if (!puedeBuscar) return;
    if (query.trim() === busqueda) {
      setAcum([]);
      setPage(0);
      reload();
    } else buscar(query);
  };

  const resultados = modo === "deslizar" ? acum : data?.content || [];
  const desdeInicio = modo === "deslizar" || data?.page === 0; // la lista empieza en la primera página
  // Los resultados vienen agrupados por producto y de menor a mayor precio dentro de cada uno.
  // En la página 0 la primera fila de cada producto es la más barata de ese producto.
  const primeraDe = (r) => resultados.findIndex((x) => nombreDe(x) === nombreDe(r));
  const masBaratoDe = (r) => (desdeInicio ? resultados[primeraDe(r)].precio : null);
  // El nombre del producto solo se repite en cada fila cuando la búsqueda abarca varios productos.
  const distintos = new Set(resultados.map(nombreDe)).size;
  const difiere = resultados.some((r) => normalizar(nombreDe(r)) !== normalizar(busqueda));
  const mostrarProducto = distintos > 1 || (difiere && (data?.totalPages || 1) > 1);

  return (
    <div className="comparar-fijo">
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

      <div className="comparar-cuerpo">
        <div className="comparar-resultados">

      {(loading && !data) || (modo === "deslizar" && data && acum.length === 0 && data.totalElements > 0) ? (
        <ListSkeleton rows={4} />
      ) : data && data.totalElements === 0 ? (
        <p className="empty">No encontramos reportes para «{busqueda}».</p>
      ) : (
        data && (
          <div className="resultados-fijo">
            <div className="resultados-cabecera">
              <div>
                <p className="row-sub" style={{ margin: 0 }}>{data.totalElements} tiendas con precio reportado para «{busqueda}»</p>
                <h3 style={{ margin: "0.15rem 0 0" }}>{mostrarProducto ? "Resultados · por producto, de más barato a más caro" : "Resultados · de más barato a más caro"}</h3>
              </div>
              <div className="segmented" role="group" aria-label="Forma de paginar">
                <button type="button" className={modo === "paginas" ? "on" : ""} aria-pressed={modo === "paginas"} onClick={() => cambiarModo("paginas")}>
                  Páginas
                </button>
                <button type="button" className={modo === "deslizar" ? "on" : ""} aria-pressed={modo === "deslizar"} onClick={() => cambiarModo("deslizar")}>
                  Deslizar
                </button>
              </div>
            </div>
            <div
              className="resultados-scroll"
              ref={caja}
              onScroll={alDeslizar}
              tabIndex={0}
              role="region"
              aria-label="Resultados de la búsqueda"
            >
            <div className={"stagger" + (loading ? " refreshing" : "")} key={modo === "deslizar" ? `d-${busqueda}` : `${data.page}-${busqueda}`} aria-busy={loading}>
              {resultados.map((r, i) => (
                <div key={r.id} className={"result-row con-acciones" + (desdeInicio && primeraDe(r) === i ? " best" : "")} style={{ "--i": i }}>
                  <div>
                    <strong>{r.tienda}</strong>
                    {desdeInicio && primeraDe(r) === i && <span className="tag-best">Más barato</span>}
                    {mostrarProducto && <div className="row-sub producto-nombre">{nombreDe(r)}</div>}
                    <div className="row-sub">
                      <MapPin size={13} aria-hidden="true" style={{ verticalAlign: -2 }} /> {r.zona} · {r.reportes} reportes
                    </div>
                  </div>
                  <span className="leader" aria-hidden="true" />
                  <strong className="price">{colones(r.precio)}</strong>
                  <div className="result-actions" style={{ flexBasis: "100%" }}>
                    {masBaratoDe(r) !== null && r.precio > masBaratoDe(r) && (
                      <span className="row-sub">+{colones(r.precio - masBaratoDe(r))} que la más barata</span>
                    )}
                    <button
                      type="button"
                      className="btn-small"
                      disabled={enLista(nombreDe(r), r.tienda)}
                      onClick={() => agregar(r)}
                      aria-label={`Agregar ${nombreDe(r)} de ${r.tienda} a la lista`}
                    >
                      {enLista(nombreDe(r), r.tienda) ? <Check size={13} aria-hidden="true" /> : <ListPlus size={13} aria-hidden="true" />}
                      {enLista(nombreDe(r), r.tienda) ? "En la lista" : "A la lista"}
                    </button>
                    <button
                      type="button"
                      className="btn-small primary"
                      onClick={() => registrar(`${nombreDe(r)} · ${r.tienda}`, r.precio)}
                      aria-label={`Registrar gasto de ${nombreDe(r)} en ${r.tienda}`}
                    >
                      <Receipt size={13} aria-hidden="true" /> Registrar gasto
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {modo === "deslizar" && (
              <p className="row-sub resultados-pie" aria-live="polite">
                {loading ? "Cargando más…" : hayMas ? "Seguí deslizando para ver más" : "Llegaste al final"}
              </p>
            )}
            </div>
            {modo === "paginas" ? (
              <Pager data={data} onPage={setPage} busy={loading} noun="tiendas" />
            ) : (
              <p className="row-sub resultados-contador">Mostrando {resultados.length} de {data.totalElements} tiendas</p>
            )}
          </div>
        )
      )}
        </div>
      {lista.length > 0 && (
        <aside className="card lista-compras" aria-label="Lista de compras">
          <div className="lista-head">
            <h3>
              <ListChecks size={17} aria-hidden="true" style={{ verticalAlign: -3, marginRight: 6 }} />
              Mi lista de compras · {lista.length} {lista.length === 1 ? "producto" : "productos"}
            </h3>
            <button type="button" className="btn-small" onClick={() => setLista([])}>
              Vaciar lista
            </button>
          </div>
          <div className="lista-items">
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
          </div>
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
        </aside>
      )}
      </div>
    </div>
  );
}

export default Comparar;
