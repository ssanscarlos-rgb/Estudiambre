import React, { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lock, PiggyBank, Plus, Sparkles } from "lucide-react";
import { apiPatch } from "../api";
import { useToast } from "./Toast";
import AmountInput from "./AmountInput";
import { CategoryIcon } from "../icons";
import { colones } from "../format";
import { CATEGORIAS_SUGERIDAS, OPCIONES_AHORRO, PLANES, ahorroEn, metaDeGasto, repartir } from "../onboarding";

const PASOS = ["Tu plan", "Categorías", "Ahorro", "Presupuesto"];
const sinTildes = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Asistente de la primera vez: plan de partida, categorías, cuánto ahorrar y presupuesto por categoría.
// Todo es editable. Al terminar guarda el plan (PATCH plan) y marca el perfil como configurado
// (PATCH perfil → preferencias.onboarded). Si la persona ya tenía plan, se parte de él.
function Bienvenida({ plan, onTerminar, onOmitir }) {
  const toast = useToast();
  const existentes = useMemo(() => plan?.categorias || [], [plan]);
  const bloqueadas = useMemo(() => new Set(existentes.filter((c) => (c.gastado || 0) > 0).map((c) => c.nombre)), [existentes]);

  const [paso, setPaso] = useState(0);
  const [planId, setPlanId] = useState(null);
  const [nombres, setNombres] = useState(() => existentes.map((c) => c.nombre));
  const [propias, setPropias] = useState([]); // categorías escritas por la persona
  const [nuevaCat, setNuevaCat] = useState("");
  const [errorCat, setErrorCat] = useState("");
  const [ingreso, setIngreso] = useState(() => (plan?.meta > 0 ? String(Math.round(plan.meta / 0.85 / 100) * 100) : "150000"));
  const [ahorroPct, setAhorroPct] = useState(15);
  const [pesos, setPesos] = useState({});
  const [montos, setMontos] = useState(() => Object.fromEntries(existentes.map((c) => [c.nombre, String(c.presupuesto)])));
  const [firma, setFirma] = useState(""); // para repartir de nuevo solo si cambió algo que lo afecta
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState("");

  const meta = metaDeGasto(ingreso, ahorroPct);
  const ahorro = ahorroEn(ingreso, ahorroPct);
  const todasLasCategorias = [...CATEGORIAS_SUGERIDAS, ...propias, ...existentes.map((c) => c.nombre)].filter((n, i, a) => a.indexOf(n) === i);

  const elegirPlan = (p) => {
    setPlanId(p.id);
    setIngreso(String(p.ingreso));
    setAhorroPct(p.ahorroPct);
    setPesos(p.categorias);
    // Las categorías con gastos ya registrados se conservan siempre.
    setNombres([...new Set([...Object.keys(p.categorias), ...bloqueadas])]);
    setFirma("");
  };

  const alternar = (n) => {
    if (bloqueadas.has(n)) return;
    setNombres((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  };

  const agregarPropia = () => {
    const nombre = nuevaCat.trim();
    if (nombre.length < 2) return setErrorCat("Escribí un nombre de al menos 2 letras");
    if (nombre.length > 30) return setErrorCat("Máximo 30 caracteres");
    const igual = todasLasCategorias.find((n) => sinTildes(n) === sinTildes(nombre));
    if (igual) {
      setNombres((prev) => (prev.includes(igual) ? prev : [...prev, igual]));
    } else {
      setPropias((prev) => [...prev, nombre]);
      setNombres((prev) => [...prev, nombre]);
    }
    setNuevaCat("");
    setErrorCat("");
  };

  const puedeSeguir = () => {
    if (paso === 0) return !!planId || existentes.length > 0;
    if (paso === 1) return nombres.length > 0;
    if (paso === 2) return Number(ingreso) > 0 && meta > 0;
    return nombres.every((n) => Number(montos[n]) > 0);
  };

  const siguiente = () => {
    if (!puedeSeguir()) return;
    if (paso === 2) {
      // Entrar al presupuesto: se reparte la meta, salvo que ya estuviera hecho para estas mismas categorías y esta meta.
      const f = `${nombres.join("|")}#${meta}`;
      if (f !== firma) {
        const auto = repartir(meta, nombres, pesos);
        setMontos(Object.fromEntries(nombres.map((n) => [n, String(auto[n])])));
        setFirma(f);
      }
    }
    setPaso((p) => p + 1);
  };

  const repartirDeNuevo = () => {
    const auto = repartir(meta, nombres, pesos);
    setMontos(Object.fromEntries(nombres.map((n) => [n, String(auto[n])])));
  };

  const asignado = nombres.reduce((t, n) => t + (Number(montos[n]) || 0), 0);
  const diferencia = meta - asignado;

  const terminar = async () => {
    if (!puedeSeguir()) return;
    setGuardando(true);
    setErrorGuardar("");
    try {
      const categorias = nombres.map((n) => {
        const previa = existentes.find((c) => c.nombre === n);
        return { nombre: n, gastado: previa?.gastado || 0, presupuesto: Number(montos[n]) };
      });
      await apiPatch("plan", { meta, categorias });
      await onTerminar({ meta, categorias }, { planTipo: planId || "actual", ingresoQuincena: Number(ingreso), ahorroPct: Number(ahorroPct) });
    } catch (e) {
      setErrorGuardar("No pudimos guardar tu plan. Revisá la conexión e intentá de nuevo.");
      toast.error(e, "No se pudo guardar el plan");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="bienvenida" role="dialog" aria-modal="true" aria-labelledby="bienvenida-titulo">
      <div className="bienvenida-card">
        <div className="bienvenida-top">
          <span className="bienvenida-paso">Paso {paso + 1} de {PASOS.length} · {PASOS[paso]}</span>
          <button type="button" className="link-btn" onClick={onOmitir} disabled={guardando}>
            Omitir por ahora
          </button>
        </div>
        <div className="paso-barra" aria-hidden="true">
          {PASOS.map((p, i) => (
            <span key={p} className={i <= paso ? "lleno" : ""} />
          ))}
        </div>

        {paso === 0 && (
          <section>
            <h2 id="bienvenida-titulo"><Sparkles size={20} aria-hidden="true" style={{ verticalAlign: -3, marginRight: 6, color: "var(--orange)" }} />Armemos tu plan</h2>
            <p className="bienvenida-texto">Elegí un punto de partida. Después podés cambiar categorías y montos: nada de esto es definitivo.</p>
            {existentes.length > 0 && (
              <p className="bienvenida-aviso">Ya tenés un plan con {existentes.length} {existentes.length === 1 ? "categoría" : "categorías"}. Podés seguir con él o partir de una plantilla (las categorías con gastos registrados se conservan).</p>
            )}
            <div className="plan-opciones" role="radiogroup" aria-label="Plan de partida">
              {PLANES.map((p) => {
                const m = metaDeGasto(p.ingreso, p.ahorroPct);
                return (
                  <button
                    type="button"
                    key={p.id}
                    role="radio"
                    aria-checked={planId === p.id}
                    className={"plan-opcion" + (planId === p.id ? " elegido" : "")}
                    onClick={() => elegirPlan(p)}
                  >
                    <strong>{p.nombre}</strong>
                    <span>{p.descripcion}</span>
                    <small>Ahorro {p.ahorroPct}% · gasto de {colones(m)} por quincena</small>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {paso === 1 && (
          <section>
            <h2 id="bienvenida-titulo">¿En qué categorías gastás?</h2>
            <p className="bienvenida-texto">Marcá las que usás. Son las que vas a ver al registrar un gasto. Podés agregar las tuyas.</p>
            <div className="chip-group" role="group" aria-label="Categorías">
              {todasLasCategorias.map((n) => (
                <button
                  type="button"
                  key={n}
                  className={"chip" + (nombres.includes(n) ? " selected" : "")}
                  aria-pressed={nombres.includes(n)}
                  title={bloqueadas.has(n) ? "Ya tiene gastos registrados: se conserva" : undefined}
                  onClick={() => alternar(n)}
                >
                  {bloqueadas.has(n) ? <Lock size={13} aria-hidden="true" /> : <CategoryIcon categoria={n} size={14} />} {n}
                </button>
              ))}
            </div>
            <div className="edit-row" style={{ marginTop: "0.75rem" }}>
              <input
                type="text"
                value={nuevaCat}
                placeholder="Otra categoría (ej. Gimnasio)"
                aria-label="Nueva categoría"
                style={{ flex: 1, minWidth: 160 }}
                onChange={(e) => {
                  setNuevaCat(e.target.value);
                  setErrorCat("");
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregarPropia())}
              />
              <button type="button" className="btn-ghost" onClick={agregarPropia}>
                <Plus size={14} aria-hidden="true" /> Agregar
              </button>
              {errorCat && <p className="field-error" role="alert" style={{ flexBasis: "100%" }}>{errorCat}</p>}
            </div>
            <p className="row-sub" style={{ marginTop: "0.75rem" }}>{nombres.length} {nombres.length === 1 ? "categoría elegida" : "categorías elegidas"}</p>
          </section>
        )}

        {paso === 2 && (
          <section>
            <h2 id="bienvenida-titulo"><PiggyBank size={20} aria-hidden="true" style={{ verticalAlign: -3, marginRight: 6, color: "var(--orange)" }} />¿Cuánto querés ahorrar?</h2>
            <p className="bienvenida-texto">Con tu ingreso de la quincena y el porcentaje que querés guardar, calculamos cuánto podés gastar.</p>
            <label htmlFor="ingreso-input">Ingreso de la quincena (₡)</label>
            <div style={{ maxWidth: 260 }}>
              <AmountInput value={ingreso} onChange={setIngreso} step={5000} ariaLabel="Ingreso de la quincena" />
            </div>
            <div style={{ marginTop: "1rem" }}>
              <label>Porcentaje a ahorrar</label>
              <div className="chip-group" role="group" aria-label="Porcentaje a ahorrar">
                {OPCIONES_AHORRO.map((o) => (
                  <button type="button" key={o} className={"chip" + (Number(ahorroPct) === o ? " selected" : "")} aria-pressed={Number(ahorroPct) === o} onClick={() => setAhorroPct(o)}>
                    {o}%
                  </button>
                ))}
              </div>
              <div style={{ maxWidth: 200 }}>
                <AmountInput value={String(ahorroPct)} onChange={(v) => setAhorroPct(Math.min(90, Number(v) || 0))} step={5} ariaLabel="Porcentaje de ahorro personalizado" />
              </div>
            </div>
            <div className="resumen-ahorro" aria-live="polite">
              <div><span>Ahorrás por quincena</span><strong>{colones(ahorro)}</strong></div>
              <div><span>Tu meta de gasto</span><strong>{colones(meta)}</strong></div>
            </div>
          </section>
        )}

        {paso === 3 && (
          <section>
            <h2 id="bienvenida-titulo">Tu presupuesto por categoría</h2>
            <p className="bienvenida-texto">Lo repartimos según tu plan. Ajustá cada monto como prefieras.</p>
            <div>
              {nombres.map((n) => (
                <div className="presupuesto-fila" key={n}>
                  <span className="row-left">
                    <span className="row-icon"><CategoryIcon categoria={n} /></span>
                    <strong>{n}</strong>
                  </span>
                  <div style={{ width: 190 }}>
                    <AmountInput value={montos[n] ?? ""} onChange={(v) => setMontos((m) => ({ ...m, [n]: v }))} step={500} ariaLabel={`Presupuesto de ${n}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className={"resumen-ahorro" + (diferencia < 0 ? " excede" : "")} aria-live="polite">
              <div><span>Asignado</span><strong>{colones(asignado)}</strong></div>
              <div>
                <span>{diferencia < 0 ? "Te pasás de la meta" : "Sin asignar"}</span>
                <strong>{colones(Math.abs(diferencia))}</strong>
              </div>
            </div>
            <button type="button" className="link-btn" onClick={repartirDeNuevo}>Repartir de nuevo según el plan</button>
            {errorGuardar && <p className="field-error" role="alert">{errorGuardar}</p>}
          </section>
        )}

        <div className="bienvenida-acciones">
          {paso > 0 ? (
            <button type="button" className="btn-ghost" onClick={() => setPaso((p) => p - 1)} disabled={guardando}>
              <ArrowLeft size={16} aria-hidden="true" /> Atrás
            </button>
          ) : (
            <span />
          )}
          {paso < PASOS.length - 1 ? (
            <button type="button" className="btn-primary" disabled={!puedeSeguir()} onClick={siguiente}>
              Siguiente <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <button type="button" className="btn-primary" disabled={!puedeSeguir() || guardando} onClick={terminar}>
              {guardando ? <span className="spinner" aria-hidden="true" /> : <Check size={16} aria-hidden="true" />} Empezar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Bienvenida;
