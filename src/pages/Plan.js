import React, { useEffect, useState } from "react";
import { Link, useOutletContext, useSearchParams } from "react-router-dom";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { apiPatch } from "../api";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import ErrorStrip from "../components/ErrorStrip";
import { Skeleton } from "../components/Skeleton";
import AmountInput from "../components/AmountInput";
import { CategoryIcon } from "../icons";
import { colones } from "../format";

function Plan() {
  const toast = useToast();
  // El plan se pide una vez en Layout y se comparte: Registrar usa las mismas categorías.
  const { plan, setPlan, planError: error, planLoading: loading, reloadPlan: reload } = useOutletContext();
  // Al entrar se refresca para ver lo gastado al día.
  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const subtitle = "Ajustá la meta de tu quincena por categoría";

  // Una notificación de presupuesto abre /plan?categoria=Comida: esa fila se resalta y se muestra.
  const [params] = useSearchParams();
  const resaltar = params.get("categoria");
  const hayPlan = !!plan;
  useEffect(() => {
    if (!resaltar || !hayPlan) return;
    document.getElementById(`cat-${resaltar}`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [resaltar, hayPlan]);

  const [editandoMeta, setEditandoMeta] = useState(false);
  const [nuevaMeta, setNuevaMeta] = useState("");
  const [guardandoMeta, setGuardandoMeta] = useState(false);
  const [errorMeta, setErrorMeta] = useState("");

  const [agregando, setAgregando] = useState(false);
  const [catNombre, setCatNombre] = useState("");
  const [catPresupuesto, setCatPresupuesto] = useState("");
  const [guardandoCat, setGuardandoCat] = useState(false);
  const [errorCat, setErrorCat] = useState("");

  // Edición de una categoría existente (se identifica por su nombre actual).
  const [editando, setEditando] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editPresupuesto, setEditPresupuesto] = useState("");
  const [errorEdit, setErrorEdit] = useState("");
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(null);

  if (!plan) {
    return (
      <>
        <PageHeader title="Plan" subtitle={subtitle} />
        <ErrorStrip error={error} onRetry={reload} retrying={loading} />
        {loading && <Skeleton h={110} r={14} />}
        {loading && (
          <div className="card" style={{ marginTop: "1.25rem" }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} h={14} style={{ marginBottom: 22 }} />
            ))}
          </div>
        )}
      </>
    );
  }

  const abrirEditarMeta = () => {
    setNuevaMeta(String(plan.meta));
    setErrorMeta("");
    setEditandoMeta(true);
  };

  const guardarMeta = async () => {
    const valor = Number(nuevaMeta);
    if (!(valor > 0)) {
      setErrorMeta("La meta debe ser mayor a 0");
      return;
    }
    if (valor === plan.meta) {
      setEditandoMeta(false);
      return;
    }
    setGuardandoMeta(true);
    setErrorMeta("");
    try {
      // PATCH: solo viaja lo que cambia (la meta).
      await apiPatch("plan", { meta: valor });
      setPlan({ ...plan, meta: valor });
      setEditandoMeta(false);
      toast.success("Meta actualizada");
    } catch (e) {
      toast.error(e, "No se pudo guardar la meta");
    } finally {
      setGuardandoMeta(false);
    }
  };

  const categorias = plan.categorias || [];
  const asignado = categorias.reduce((t, c) => t + (Number(c.presupuesto) || 0), 0);
  const existe = (nombre, excepto) =>
    categorias.some((c) => c.nombre !== excepto && c.nombre.trim().toLowerCase() === nombre.trim().toLowerCase());

  // PATCH con el arreglo completo de categorías, como define el contrato.
  const guardarCategorias = async (lista) => {
    await apiPatch("plan", { categorias: lista });
    setPlan({ ...plan, categorias: lista });
  };

  const abrirEditar = (c) => {
    setEditando(c.nombre);
    setEditNombre(c.nombre);
    setEditPresupuesto(String(c.presupuesto));
    setErrorEdit("");
    setConfirmarBorrar(null);
  };

  const guardarEdicion = async (c) => {
    const nombre = editNombre.trim();
    if (nombre.length < 2 || !(Number(editPresupuesto) > 0)) {
      setErrorEdit("Ponle un nombre y un presupuesto mayor a 0");
      return;
    }
    if (existe(nombre, c.nombre)) {
      setErrorEdit("Ya existe una categoría con ese nombre");
      return;
    }
    if (nombre === c.nombre && Number(editPresupuesto) === c.presupuesto) {
      setEditando(null);
      return;
    }
    setGuardandoEdit(true);
    setErrorEdit("");
    try {
      await guardarCategorias(categorias.map((x) => (x.nombre === c.nombre ? { ...x, nombre, presupuesto: Number(editPresupuesto) } : x)));
      setEditando(null);
      toast.success(`Categoría actualizada · ${nombre}`);
    } catch (e) {
      toast.error(e, "No se pudo actualizar la categoría");
    } finally {
      setGuardandoEdit(false);
    }
  };

  const eliminarCategoria = async (c) => {
    setGuardandoEdit(true);
    try {
      await guardarCategorias(categorias.filter((x) => x.nombre !== c.nombre));
      toast.success(`Categoría eliminada · ${c.nombre}`);
    } catch (e) {
      toast.error(e, "No se pudo eliminar la categoría");
    } finally {
      setGuardandoEdit(false);
      setConfirmarBorrar(null);
    }
  };

  const guardarCategoria = async () => {
    if (catNombre.trim().length < 2 || !(Number(catPresupuesto) > 0)) {
      setErrorCat("Ponle un nombre y un presupuesto mayor a 0");
      return;
    }
    if (existe(catNombre)) {
      setErrorCat("Ya existe una categoría con ese nombre");
      return;
    }
    setGuardandoCat(true);
    setErrorCat("");
    try {
      const nueva = { nombre: catNombre.trim(), gastado: 0, presupuesto: Number(catPresupuesto) };
      await guardarCategorias([...categorias, nueva]);
      setCatNombre("");
      setCatPresupuesto("");
      setAgregando(false);
      toast.success(`Categoría agregada · ${nueva.nombre}`);
    } catch (e) {
      toast.error(e, "No se pudo agregar la categoría");
    } finally {
      setGuardandoCat(false);
    }
  };

  return (
    <>
      <PageHeader title="Plan" subtitle={subtitle} />
      <ErrorStrip error={error} onRetry={reload} retrying={loading} />

      <div className="card-hero hero-row">
        {editandoMeta ? (
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 180 }}>
              <AmountInput value={nuevaMeta} onChange={setNuevaMeta} ariaLabel="Nueva meta" />
            </div>
            <button type="button" className="btn-primary btn-light" disabled={guardandoMeta} onClick={guardarMeta}>
              {guardandoMeta && <span className="spinner" aria-hidden="true" />}
              Guardar
            </button>
            <button type="button" className="btn-ghost" style={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff" }} disabled={guardandoMeta} onClick={() => setEditandoMeta(false)}>
              Cancelar
            </button>
            {errorMeta && <p className="field-error on-hero" role="alert">{errorMeta}</p>}
          </div>
        ) : (
          <>
            <div>
              <div className="label">META DE LA QUINCENA</div>
              <div className="amount">{colones(plan.meta)}</div>
            </div>
            <button type="button" className="btn-primary btn-light" onClick={abrirEditarMeta}>
              <Pencil size={14} style={{ marginRight: 4, verticalAlign: -2 }} aria-hidden="true" />
              Editar meta
            </button>
          </>
        )}
      </div>

      <div className="card" style={{ marginTop: "1.25rem" }}>
        <h3>Desglose por categoría</h3>
        <p className="row-sub" style={{ marginBottom: "0.75rem" }}>
          Asignado {colones(asignado)} de {colones(plan.meta)}
          {asignado > plan.meta
            ? ` · te pasás ${colones(asignado - plan.meta)} de la meta`
            : ` · te quedan ${colones(plan.meta - asignado)} sin asignar`}
          . Estas categorías son las que aparecen al <Link to="/registrar" className="dropdown-link">registrar un gasto</Link>.
        </p>
        {categorias.length === 0 && <p className="empty">Aún no hay categorías. Agregá la primera para poder registrar gastos.</p>}
        <div className="stagger">
          {categorias.map((c, i) => {
            const pct = c.presupuesto ? (c.gastado / c.presupuesto) * 100 : 0;
            const bloqueada = (c.gastado || 0) > 0; // con gastos asociados no se renombra ni se borra
            if (editando === c.nombre) {
              return (
                <div className="edit-row" key={c.nombre} id={`cat-${c.nombre}`}>
                  <input
                    type="text"
                    value={editNombre}
                    aria-label={`Nombre de ${c.nombre}`}
                    disabled={bloqueada || guardandoEdit}
                    title={bloqueada ? "Ya tiene gastos: el nombre no se puede cambiar" : undefined}
                    style={{ flex: 1, minWidth: 140 }}
                    onChange={(e) => setEditNombre(e.target.value)}
                  />
                  <div style={{ width: 160 }}>
                    <AmountInput value={editPresupuesto} onChange={setEditPresupuesto} ariaLabel={`Presupuesto de ${c.nombre}`} />
                  </div>
                  <button type="button" className="btn-primary" disabled={guardandoEdit} onClick={() => guardarEdicion(c)}>
                    {guardandoEdit && <span className="spinner" aria-hidden="true" />}
                    Guardar
                  </button>
                  <button type="button" className="btn-ghost" disabled={guardandoEdit} onClick={() => setEditando(null)}>
                    Cancelar
                  </button>
                  {bloqueada && <p className="row-sub" style={{ flexBasis: "100%" }}>Tiene gastos este período: solo podés cambiar el presupuesto.</p>}
                  {errorEdit && <p className="field-error" role="alert" style={{ flexBasis: "100%" }}>{errorEdit}</p>}
                </div>
              );
            }
            return (
              <div
                className={"plan-row" + (resaltar === c.nombre ? " resaltada" : "")}
                id={`cat-${c.nombre}`}
                key={c.nombre}
                style={{ "--i": i }}
              >
                <div className="plan-head">
                  <span className="row-left">
                    <span className="row-icon"><CategoryIcon categoria={c.nombre} /></span>
                    <strong>{c.nombre}</strong>
                  </span>
                  <span className="plan-head-right">
                    <span className="row-sub">
                      {colones(c.gastado)} de {colones(c.presupuesto)} · {Math.round(pct)}%
                    </span>
                    {confirmarBorrar === c.nombre ? (
                      <span className="row-actions" style={{ opacity: 1 }}>
                        <span className="row-sub">¿Eliminar?</span>
                        <button type="button" className="row-icon-btn danger" aria-label={`Confirmar eliminar ${c.nombre}`} disabled={guardandoEdit} onClick={() => eliminarCategoria(c)}>
                          <Check size={14} />
                        </button>
                        <button type="button" className="row-icon-btn" aria-label="Cancelar eliminación" onClick={() => setConfirmarBorrar(null)}>
                          <X size={14} />
                        </button>
                      </span>
                    ) : (
                      <span className="row-actions">
                        <button type="button" className="row-icon-btn" aria-label={`Editar ${c.nombre}`} onClick={() => abrirEditar(c)}>
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          className="row-icon-btn danger"
                          aria-label={`Eliminar ${c.nombre}`}
                          disabled={bloqueada}
                          title={bloqueada ? "Tiene gastos este período: no se puede eliminar" : undefined}
                          onClick={() => setConfirmarBorrar(c.nombre)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </span>
                    )}
                  </span>
                </div>
                <div
                  className="progress-track light"
                  role="progressbar"
                  aria-label={`Gasto en ${c.nombre}`}
                  aria-valuenow={Math.round(Math.min(100, pct))}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className={"progress-fill green" + (pct >= 100 ? " over" : "")} style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {agregando ? (
          <div className="edit-row" style={{ marginTop: "0.5rem" }}>
            <input
              type="text"
              placeholder="Nombre de la categoría"
              value={catNombre}
              aria-label="Nombre de la categoría"
              style={{ flex: 1, minWidth: 140 }}
              onChange={(e) => setCatNombre(e.target.value)}
            />
            <div style={{ width: 160 }}>
              <AmountInput value={catPresupuesto} onChange={setCatPresupuesto} ariaLabel="Presupuesto" placeholder="Presupuesto" />
            </div>
            <button type="button" className="btn-primary" disabled={guardandoCat} onClick={guardarCategoria}>
              {guardandoCat && <span className="spinner" aria-hidden="true" />}
              Agregar
            </button>
            <button type="button" className="btn-ghost" disabled={guardandoCat} onClick={() => setAgregando(false)}>
              Cancelar
            </button>
            {errorCat && <p className="field-error" role="alert" style={{ flexBasis: "100%" }}>{errorCat}</p>}
          </div>
        ) : (
          <button type="button" className="chip" onClick={() => setAgregando(true)}>
            + Agregar categoría
          </button>
        )}
      </div>
    </>
  );
}

export default Plan;
