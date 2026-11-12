import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { apiGet, apiPatch } from "../api";
import useApi from "../hooks/useApi";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import ErrorStrip from "../components/ErrorStrip";
import { Skeleton } from "../components/Skeleton";
import AmountInput from "../components/AmountInput";
import { CategoryIcon } from "../icons";
import { colones } from "../format";

const fetchPlan = () => apiGet("plan");

function Plan() {
  const toast = useToast();
  const { data: plan, setData: setPlan, error, loading, reload } = useApi(fetchPlan);
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

  const guardarCategoria = async () => {
    if (catNombre.trim().length < 2 || !(Number(catPresupuesto) > 0)) {
      setErrorCat("Ponle un nombre y un presupuesto mayor a 0");
      return;
    }
    setGuardandoCat(true);
    setErrorCat("");
    try {
      // PATCH con el arreglo completo de categorías, como define el contrato.
      const nueva = { nombre: catNombre.trim(), gastado: 0, presupuesto: Number(catPresupuesto) };
      const categorias = [...plan.categorias, nueva];
      await apiPatch("plan", { categorias });
      setPlan({ ...plan, categorias });
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
        <div className="stagger">
          {plan.categorias.map((c, i) => {
            const pct = c.presupuesto ? (c.gastado / c.presupuesto) * 100 : 0;
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
                  <span className="row-sub">
                    {colones(c.gastado)} de {colones(c.presupuesto)} · {Math.round(pct)}%
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
