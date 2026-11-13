import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { apiPost, apiPatch, apiDelete } from "../api";
import usePagedResource from "../hooks/usePagedResource";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import ErrorStrip from "../components/ErrorStrip";
import Pager from "../components/Pager";
import { ListSkeleton } from "../components/Skeleton";
import AmountInput from "../components/AmountInput";
import Suggest from "../components/Suggest";
import { CategoryIcon } from "../icons";
import { colones, formatFecha } from "../format";
import { vaciarLista } from "../lista";
import { useAuth } from "../auth";

// Respaldo si el Plan aún no carga o no tiene categorías. Normalmente se usan las del Plan.
const CATEGORIAS_RESPALDO = ["Comida", "Transporte", "Servicios", "Estudio", "Antojos", "Otros"];
const PAGE_SIZE = 5;

function validar(descripcion, monto) {
  const e = {};
  if (descripcion.trim().length < 2) e.descripcion = "Escribe una descripción (mínimo 2 caracteres).";
  const n = Number(monto);
  if (!monto) e.monto = "Ingresa un monto.";
  else if (!(n > 0)) e.monto = "El monto debe ser mayor a 0.";
  else if (n > 10000000) e.monto = "El monto es demasiado alto.";
  return e;
}

function EditRow({ gasto, categorias, onCancel, onSave }) {
  const toast = useToast();
  const [descripcion, setDescripcion] = useState(gasto.descripcion);
  const [monto, setMonto] = useState(String(gasto.monto));
  const [categoria, setCategoria] = useState(gasto.categoria);
  const [saving, setSaving] = useState(false);
  const valido = descripcion.trim().length >= 2 && Number(monto) > 0;

  const save = async () => {
    // PATCH: solo viajan los campos que cambiaron.
    const cambios = {};
    if (descripcion.trim() !== gasto.descripcion) cambios.descripcion = descripcion.trim();
    if (Number(monto) !== gasto.monto) cambios.monto = Number(monto);
    if (categoria !== gasto.categoria) cambios.categoria = categoria;
    if (Object.keys(cambios).length === 0) {
      onCancel();
      return;
    }

    setSaving(true);
    try {
      const res = await apiPatch(`gastos/${gasto.id}`, cambios);
      onSave(res && res.id !== undefined ? res : { ...gasto, ...cambios });
    } catch (e) {
      toast.error(e, "No se pudo actualizar el gasto");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-row">
      <input
        type="text"
        value={descripcion}
        aria-label="Editar descripción"
        style={{ flex: 1, minWidth: 140 }}
        onChange={(e) => setDescripcion(e.target.value)}
      />
      <select value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Editar categoría">
        {(categorias.includes(gasto.categoria) ? categorias : [gasto.categoria, ...categorias]).map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <div style={{ width: 150 }}>
        <AmountInput value={monto} onChange={setMonto} ariaLabel="Editar monto" />
      </div>
      <button type="button" className="btn-primary" disabled={saving || !valido} onClick={save}>
        {saving && <span className="spinner" aria-hidden="true" />}
        Guardar
      </button>
      <button type="button" className="btn-ghost" onClick={onCancel} disabled={saving}>
        Cancelar
      </button>
    </div>
  );
}

function Registrar() {
  const toast = useToast();
  const { user } = useAuth();
  // Las categorías salen del Plan (se editan allá). Un gasto nuevo también cambia lo gastado del Plan.
  const { plan, reloadPlan } = useOutletContext();
  const categorias = useMemo(() => {
    const delPlan = (plan?.categorias || []).map((c) => c.nombre);
    return delPlan.length ? delPlan : CATEGORIAS_RESPALDO;
  }, [plan]);
  const usaRespaldo = !(plan?.categorias || []).length;

  // Comparar manda los datos por la URL: /registrar?descripcion=…&monto=…&origen=lista
  const [urlParams, setParams] = useSearchParams();
  const [origen, setOrigen] = useState(null);

  // Paginación real: se pide UNA página al servidor (página base 0) con
  // GET gastos?page=&size=&q=. La búsqueda también la hace el servidor, con
  // un pequeño retraso para no pedir en cada tecla.
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(busqueda.trim()), 350);
    return () => clearTimeout(t);
  }, [busqueda]);

  const params = useMemo(() => ({ q }), [q]);
  const { data: pageData, setData: setPageData, loading, error, page, setPage, reload } = usePagedResource("gastos", {
    size: PAGE_SIZE,
    params,
  });

  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [borrandoId, setBorrandoId] = useState(null);
  const [confirmarId, setConfirmarId] = useState(null);

  // La categoría elegida siempre debe existir en la lista actual.
  useEffect(() => {
    if (!categorias.includes(categoria)) setCategoria(categorias.includes("Comida") ? "Comida" : categorias[0]);
  }, [categorias, categoria]);

  // Datos que llegan desde Comparar: se cargan una vez y se limpia la URL.
  useEffect(() => {
    const d = urlParams.get("descripcion");
    const m = urlParams.get("monto");
    if (d === null && m === null) return;
    if (d) setDescripcion(d.slice(0, 80));
    if (m && Number(m) > 0) setMonto(String(Math.round(Number(m))));
    setOrigen(urlParams.get("origen"));
    setParams({}, { replace: true });
  }, [urlParams, setParams]);

  const items = useMemo(() => pageData?.content || [], [pageData]);
  const descripcionesPrevias = useMemo(() => Array.from(new Set(items.map((g) => g.descripcion))), [items]);
  const camposCompletos = descripcion.trim().length >= 2 && Number(monto) > 0;

  // El gasto nuevo aparece en la primera página (los más recientes primero).
  const volverAlInicio = () => {
    setBusqueda("");
    if (q) {
      setQ(""); // cambia el filtro → recarga sola en la página 0
      return;
    }
    if (page !== 0) setPage(0);
    else reload();
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const e = validar(descripcion, monto);
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const nuevo = { descripcion: descripcion.trim(), monto: Number(monto), categoria };
      await apiPost("gastos", nuevo);
      toast.success(`Gasto guardado · ${nuevo.descripcion}`);
      if (origen === "lista") vaciarLista(user?.email); // la compra ya quedó registrada
      setOrigen(null);
      reloadPlan();
      setDescripcion("");
      setMonto("");
      volverAlInicio();
    } catch (err) {
      toast.error(err, "No se pudo guardar el gasto");
    } finally {
      setSaving(false);
    }
  };

  const onGuardarEdicion = (actualizado) => {
    setPageData((prev) => ({ ...prev, content: prev.content.map((g) => (g.id === actualizado.id ? actualizado : g)) }));
    setEditandoId(null);
    reloadPlan();
    toast.success(`Gasto actualizado · ${actualizado.descripcion}`);
  };

  const eliminar = async (gasto) => {
    setBorrandoId(gasto.id);
    try {
      await apiDelete(`gastos/${gasto.id}`);
      toast.success(`Gasto eliminado · ${gasto.descripcion}`);
      reloadPlan();
      reload();
    } catch (e) {
      toast.error(e, "No se pudo eliminar el gasto");
    } finally {
      setBorrandoId(null);
      setConfirmarId(null);
    }
  };

  return (
    <>
      <PageHeader title="Registrar" subtitle="Anotá un gasto en menos de 15 segundos" />

      <div className="card mb">
        <h3>Nuevo gasto</h3>
        <form onSubmit={onSubmit} noValidate>
          <div className="form-row">
            <div className="field">
              <label htmlFor="descripcion-input">
                Descripción <span className="req" aria-hidden="true">*</span>
              </label>
              <Suggest
                value={descripcion}
                onChange={(v) => {
                  setDescripcion(v);
                  setErrors((p) => ({ ...p, descripcion: undefined }));
                }}
                options={descripcionesPrevias}
                placeholder="Ej. Almuerzo en la soda"
                ariaLabel="Descripción"
                inputProps={{
                  id: "descripcion-input",
                  required: true,
                  "aria-required": "true",
                  "aria-invalid": !!errors.descripcion,
                  "aria-describedby": "err-desc",
                }}
              />
              {errors.descripcion && <p className="field-error" id="err-desc" role="alert">{errors.descripcion}</p>}
            </div>
            <div className="field narrow">
              <label htmlFor="monto-input">
                Monto (₡) <span className="req" aria-hidden="true">*</span>
              </label>
              <AmountInput
                value={monto}
                onChange={(v) => {
                  setMonto(v);
                  setErrors((p) => ({ ...p, monto: undefined }));
                }}
                placeholder="0"
                ariaLabel="Monto en colones"
                ariaInvalid={!!errors.monto}
                ariaDescribedBy="err-monto"
              />
              {errors.monto && <p className="field-error" id="err-monto" role="alert">{errors.monto}</p>}
            </div>
          </div>

          <div className="chip-group" role="group" aria-label="Categoría">
            {categorias.map((c) => (
              <button
                type="button"
                key={c}
                className={"chip" + (categoria === c ? " selected" : "")}
                aria-pressed={categoria === c}
                onClick={() => setCategoria(c)}
              >
                <CategoryIcon categoria={c} size={14} /> {c}
              </button>
            ))}
          </div>
          <p className="row-sub cat-hint">
            {usaRespaldo ? "Categorías por defecto. " : "Categorías de tu Plan. "}
            <Link to="/plan" className="dropdown-link">{usaRespaldo ? "Crear las tuyas en el Plan" : "Administrarlas"}</Link>
          </p>

          <button type="submit" className="btn-primary" disabled={saving || !camposCompletos}>
            {saving && <span className="spinner" aria-hidden="true" />}
            {saving ? "Guardando…" : "Guardar gasto"}
          </button>
          <p className="required-note">* Campos obligatorios para poder guardar</p>
        </form>
      </div>

      <div className="card">
        <div className="pref-row" style={{ marginBottom: "0.75rem", gap: "1rem", flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Historial reciente</h3>
          <div style={{ maxWidth: 240, width: "100%" }}>
            <Suggest
              value={busqueda}
              onChange={setBusqueda}
              options={descripcionesPrevias}
              placeholder="Buscar en el historial…"
              ariaLabel="Buscar en el historial"
            />
          </div>
        </div>

        <ErrorStrip error={error} onRetry={reload} retrying={loading} />

        {loading && !pageData ? (
          <ListSkeleton rows={4} />
        ) : (
          pageData && (
            <>
              <div className={"stagger" + (loading ? " refreshing" : "")} key={`${pageData.page}-${q}`} aria-busy={loading}>
                {items.map((g, i) =>
                  editandoId === g.id ? (
                    <EditRow key={g.id} gasto={g} categorias={categorias} onCancel={() => setEditandoId(null)} onSave={onGuardarEdicion} />
                  ) : (
                    <div className="list-row" key={g.id} style={{ "--i": i }}>
                      <div className="row-left">
                        <div className="row-icon"><CategoryIcon categoria={g.categoria} /></div>
                        <div>
                          <div className="row-title">{g.descripcion}</div>
                          <div className="row-sub">{formatFecha(g.fecha)} · {g.categoria}</div>
                        </div>
                      </div>

                      {confirmarId === g.id ? (
                        <div className="row-actions" style={{ opacity: 1 }}>
                          <span className="row-sub">¿Eliminar?</span>
                          <button
                            type="button"
                            className="row-icon-btn danger"
                            aria-label="Confirmar eliminación"
                            disabled={borrandoId === g.id}
                            onClick={() => eliminar(g)}
                          >
                            {borrandoId === g.id ? <span className="spinner" aria-hidden="true" /> : <Check size={14} />}
                          </button>
                          <button
                            type="button"
                            className="row-icon-btn"
                            aria-label="Cancelar eliminación"
                            onClick={() => setConfirmarId(null)}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <span>-{colones(g.monto)}</span>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="row-icon-btn"
                              aria-label={`Editar ${g.descripcion}`}
                              onClick={() => setEditandoId(g.id)}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              type="button"
                              className="row-icon-btn danger"
                              aria-label={`Eliminar ${g.descripcion}`}
                              onClick={() => setConfirmarId(g.id)}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
              {items.length === 0 && (
                <p className="empty">{q ? `Sin resultados para «${q}».` : "Aún no hay gastos registrados."}</p>
              )}
              <Pager data={pageData} onPage={setPage} busy={loading} noun="gastos" />
            </>
          )
        )}
      </div>
    </>
  );
}

export default Registrar;
