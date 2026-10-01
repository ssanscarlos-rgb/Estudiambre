import React, { useMemo, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { apiGet, apiPost, apiPut, apiDelete } from "../api";
import useApi from "../hooks/useApi";
import PageHeader from "../components/PageHeader";
import ErrorState from "../components/ErrorState";
import { ListSkeleton } from "../components/Skeleton";
import AmountInput from "../components/AmountInput";
import Suggest from "../components/Suggest";
import { CategoryIcon } from "../icons";
import { colones } from "../format";

const CATEGORIAS = ["Comida", "Transporte", "Servicios", "Estudio", "Antojos", "Otros"];
const PAGE_SIZE = 5;
const fetchGastos = () => apiGet("gastos");

function validar(descripcion, monto) {
  const e = {};
  if (descripcion.trim().length < 2) e.descripcion = "Escribe una descripción (mínimo 2 caracteres).";
  const n = Number(monto);
  if (!monto) e.monto = "Ingresa un monto.";
  else if (!(n > 0)) e.monto = "El monto debe ser mayor a 0.";
  else if (n > 10000000) e.monto = "El monto es demasiado alto.";
  return e;
}

function EditRow({ gasto, onCancel, onSave }) {
  const [descripcion, setDescripcion] = useState(gasto.descripcion);
  const [monto, setMonto] = useState(String(gasto.monto));
  const [categoria, setCategoria] = useState(gasto.categoria);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const valido = descripcion.trim().length >= 2 && Number(monto) > 0;

  const save = async () => {
    setErr(null);
    setSaving(true);
    try {
      const actualizado = { ...gasto, descripcion: descripcion.trim(), monto: Number(monto), categoria };
      await apiPut(`gastos/${gasto.id}`, actualizado);
      onSave(actualizado);
    } catch (e) {
      setErr(e);
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
        {CATEGORIAS.map((c) => (
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
      {err && <ErrorState compact error={err} />}
    </div>
  );
}

function Registrar() {
  const { data, setData, error, loading, reload } = useApi(fetchGastos);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("Comida");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [page, setPage] = useState(1);
  const [editandoId, setEditandoId] = useState(null);
  const [borrandoId, setBorrandoId] = useState(null);
  const [confirmarId, setConfirmarId] = useState(null);

  const items = useMemo(() => (Array.isArray(data) ? data : data?.items || []), [data]);
  const descripcionesPrevias = useMemo(
    () => Array.from(new Set(items.map((g) => g.descripcion))),
    [items]
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return q ? items.filter((g) => `${g.descripcion} ${g.categoria}`.toLowerCase().includes(q)) : items;
  }, [items, busqueda]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * PAGE_SIZE;
  const visibles = filtrados.slice(start, start + PAGE_SIZE);

  const camposCompletos = descripcion.trim().length >= 2 && Number(monto) > 0;

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setSubmitError(null);
    const e = validar(descripcion, monto);
    setErrors(e);
    if (Object.keys(e).length) return;

    setSaving(true);
    try {
      const nuevo = { descripcion: descripcion.trim(), monto: Number(monto), categoria };
      await apiPost("gastos", nuevo);
      setData([{ id: Date.now(), fecha: "Hoy", ...nuevo }, ...items]);
      setToast(`Gasto guardado · ${nuevo.descripcion}`);
      setTimeout(() => setToast(""), 3000);
      setDescripcion("");
      setMonto("");
      setBusqueda("");
      setPage(1);
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSaving(false);
    }
  };

  const onGuardarEdicion = (actualizado) => {
    setData(items.map((g) => (g.id === actualizado.id ? actualizado : g)));
    setEditandoId(null);
    setToast(`Gasto actualizado · ${actualizado.descripcion}`);
    setTimeout(() => setToast(""), 3000);
  };

  const eliminar = async (gasto) => {
    setBorrandoId(gasto.id);
    try {
      await apiDelete(`gastos/${gasto.id}`);
      setData(items.filter((g) => g.id !== gasto.id));
      setToast(`Gasto eliminado · ${gasto.descripcion}`);
      setTimeout(() => setToast(""), 3000);
    } catch (e) {
      setSubmitError(e);
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
            {CATEGORIAS.map((c) => (
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

          {submitError && (
            <div className="shake">
              <ErrorState compact error={submitError} />
            </div>
          )}

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
              onChange={(v) => {
                setBusqueda(v);
                setPage(1);
              }}
              options={descripcionesPrevias}
              placeholder="Buscar gasto…"
              ariaLabel="Buscar en el historial"
            />
          </div>
        </div>

        {error ? (
          <ErrorState compact error={error} onRetry={reload} />
        ) : loading ? (
          <ListSkeleton rows={4} />
        ) : (
          <>
            <div className="stagger" key={`${current}-${busqueda}`}>
              {visibles.map((g, i) =>
                editandoId === g.id ? (
                  <EditRow key={g.id} gasto={g} onCancel={() => setEditandoId(null)} onSave={onGuardarEdicion} />
                ) : (
                  <div className="list-row" key={g.id} style={{ "--i": i }}>
                    <div className="row-left">
                      <div className="row-icon"><CategoryIcon categoria={g.categoria} /></div>
                      <div>
                        <div className="row-title">{g.descripcion}</div>
                        <div className="row-sub">{g.fecha} · {g.categoria}</div>
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
            {filtrados.length === 0 && (
              <p className="empty">{busqueda ? `Sin resultados para «${busqueda}».` : "Aún no hay gastos registrados."}</p>
            )}
            {filtrados.length > 0 && (
              <div className="pagination">
                <span className="row-sub">
                  Mostrando {start + 1}–{start + visibles.length} de {filtrados.length}
                </span>
                <div className="pager">
                  <button type="button" className="btn-ghost" disabled={current <= 1} onClick={() => setPage(current - 1)}>
                    ← Anterior
                  </button>
                  <span>{current} / {totalPages}</span>
                  <button type="button" className="btn-ghost" disabled={current >= totalPages} onClick={() => setPage(current + 1)}>
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="toast-region" aria-live="polite">
        {toast && (
          <div className="toast">
            <Check size={16} aria-hidden="true" /> {toast}
          </div>
        )}
      </div>
    </>
  );
}

export default Registrar;
