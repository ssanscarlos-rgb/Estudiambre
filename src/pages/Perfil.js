import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Moon, Bell, Award, LogOut, Pencil } from "lucide-react";
import { apiPatch } from "../api";
import { useAuth } from "../auth";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import ErrorStrip from "../components/ErrorStrip";
import { Skeleton } from "../components/Skeleton";
import { soportado, permiso, activados, activar, desactivar, mostrar } from "../avisosNavegador";
import { describirQuincena, iniciales, normalizarDias } from "../format";

const MAX_NOMBRE = 60;
const MAX_UNIVERSIDAD = 100;

const diaValido = (v) => /^\d{1,2}$/.test(v) && Number(v) >= 1 && Number(v) <= 31;

function validar({ nombre, universidad, dia1, dia2 }) {
  const e = {};
  if (nombre.trim().length > MAX_NOMBRE) e.nombre = `Máximo ${MAX_NOMBRE} caracteres.`;
  if (universidad.trim().length > MAX_UNIVERSIDAD) e.universidad = `Máximo ${MAX_UNIVERSIDAD} caracteres.`;
  if (!diaValido(dia1)) e.dia1 = "Un día entre 1 y 31.";
  if (dia2 !== "" && !diaValido(dia2)) e.dia2 = "Un día entre 1 y 31.";
  else if (dia2 !== "" && !e.dia1 && Number(dia2) === Number(dia1)) e.dia2 = "Debe ser distinto al primero.";
  return e;
}

// Interruptor de avisos del navegador (Web Notifications). El permiso lo da cada navegador.
function AvisosNavegador() {
  const toast = useToast();
  const [encendido, setEncendido] = useState(activados);
  const [estado, setEstado] = useState(permiso);

  const cambiar = async () => {
    if (encendido) {
      desactivar();
      setEncendido(false);
      return;
    }
    const p = await activar();
    setEstado(p);
    setEncendido(p === "granted");
    if (p === "denied") toast.info("El navegador bloqueó los avisos. Activalos en los permisos del sitio.");
  };

  const probar = () => {
    if (!mostrar({ id: "prueba", titulo: "EstudiAmbre", mensaje: "Así se verán tus avisos de presupuesto." })) {
      toast.info("No se pudo mostrar el aviso de prueba");
    }
  };

  let detalle = "Un aviso del sistema cuando llegue una notificación y no estés viendo la app.";
  if (!soportado()) detalle = "Este navegador no permite avisos del sistema.";
  else if (estado === "denied") detalle = "Bloqueados en este navegador: cambialo en los permisos del sitio.";

  return (
    <div className="pref-row" style={{ marginTop: "0.75rem" }}>
      <div className="row-left">
        <div className="row-icon"><Bell size={16} aria-hidden="true" /></div>
        <div>
          <div className="row-title">Avisos del navegador</div>
          <div className="row-sub">
            {detalle}
            {encendido && (
              <>
                {" "}
                <button type="button" className="link-btn" onClick={probar}>Probar aviso</button>
              </>
            )}
          </div>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        className="switch"
        aria-checked={encendido}
        aria-label="Avisos del navegador"
        disabled={!soportado() || estado === "denied"}
        onClick={cambiar}
      />
    </div>
  );
}

function Perfil() {
  const { theme, toggleTheme, perfil: p, setPerfil, perfilLoading, perfilError, reloadPerfil, displayName } =
    useOutletContext();
  const { user, signOut } = useAuth();
  const toast = useToast();
  const subtitle = "Tus datos y preferencias";

  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: "", universidad: "", dia1: "", dia2: "" });
  const [errors, setErrors] = useState({});

  if (!p) {
    return (
      <>
        <PageHeader title="Perfil" subtitle={subtitle} />
        <ErrorStrip error={perfilError} onRetry={reloadPerfil} retrying={perfilLoading} />
        {perfilLoading && (
          <>
            <Skeleton h={100} r={14} />
            <div className="grid-2">
              <Skeleton h={80} r={14} />
              <Skeleton h={80} r={14} />
            </div>
          </>
        )}
      </>
    );
  }

  const diasActuales = normalizarDias(p.quincenaDias);

  const abrirEdicion = () => {
    setForm({
      nombre: p.nombre || "",
      universidad: p.universidad || "",
      dia1: diasActuales[0] ? String(diasActuales[0]) : "",
      dia2: diasActuales[1] ? String(diasActuales[1]) : "",
    });
    setErrors({});
    setEditando(true);
  };

  const cambiar = (campo) => (e) => {
    setForm((f) => ({ ...f, [campo]: e.target.value }));
    setErrors((prev) => ({ ...prev, [campo]: undefined }));
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    const e = validar(form);
    setErrors(e);
    if (Object.keys(e).length) return;

    // PATCH: solo los campos que cambiaron.
    const cambios = {};
    if (form.nombre.trim() !== (p.nombre || "")) cambios.nombre = form.nombre.trim();
    if (form.universidad.trim() !== (p.universidad || "")) cambios.universidad = form.universidad.trim();
    const nuevosDias = [Number(form.dia1), ...(form.dia2 !== "" ? [Number(form.dia2)] : [])].sort((a, b) => a - b);
    if (nuevosDias.join() !== diasActuales.join()) cambios.quincenaDias = nuevosDias;

    if (Object.keys(cambios).length === 0) {
      setEditando(false);
      return;
    }

    setSaving(true);
    try {
      const res = await apiPatch("perfil", cambios);
      setPerfil(res && "quincenaDias" in res ? res : { ...p, ...cambios });
      setEditando(false);
      toast.success("Perfil actualizado");
    } catch (err) {
      toast.error(err, "No se pudo guardar el perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Perfil" subtitle={subtitle} />
      <ErrorStrip error={perfilError} onRetry={reloadPerfil} retrying={perfilLoading} />

      <div className="card mb" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {user?.picture ? (
          <img
            className="avatar avatar-img"
            style={{ width: 56, height: 56 }}
            src={user.picture}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="avatar" style={{ width: 56, height: 56, fontSize: "1.2rem" }}>
            {iniciales(displayName)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong>{displayName}</strong>
          <div className="row-sub">{user?.email}</div>
          <div className="row-sub">Correo y foto vienen de tu cuenta de Google y no se pueden editar.</div>
        </div>
        <button type="button" className="btn-ghost" onClick={signOut}>
          <LogOut size={14} style={{ marginRight: 4, verticalAlign: -2 }} aria-hidden="true" />
          Cerrar sesión
        </button>
      </div>

      <div className="card">
        <div className="pref-row" style={{ marginBottom: editando ? "0.75rem" : 0 }}>
          <h3 style={{ margin: 0 }}>Mis datos</h3>
          {!editando && (
            <button type="button" className="btn-ghost" onClick={abrirEdicion}>
              <Pencil size={13} style={{ marginRight: 4, verticalAlign: -2 }} aria-hidden="true" />
              Editar
            </button>
          )}
        </div>

        {editando ? (
          <form onSubmit={guardar} noValidate>
            <div className="form-row">
              <div className="field">
                <label htmlFor="perfil-nombre">Nombre para mostrar</label>
                <input
                  id="perfil-nombre"
                  type="text"
                  value={form.nombre}
                  placeholder={user?.name}
                  aria-invalid={!!errors.nombre}
                  onChange={cambiar("nombre")}
                />
                {errors.nombre ? (
                  <p className="field-error" role="alert">{errors.nombre}</p>
                ) : (
                  <p className="required-note">Si lo dejas vacío usamos el de tu cuenta de Google.</p>
                )}
              </div>
              <div className="field">
                <label htmlFor="perfil-universidad">Universidad</label>
                <input
                  id="perfil-universidad"
                  type="text"
                  value={form.universidad}
                  placeholder="Ej. TEC San Carlos"
                  aria-invalid={!!errors.universidad}
                  onChange={cambiar("universidad")}
                />
                {errors.universidad && <p className="field-error" role="alert">{errors.universidad}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="perfil-dia1">
                  Primer día de quincena <span className="req" aria-hidden="true">*</span>
                </label>
                <input
                  id="perfil-dia1"
                  type="number"
                  min={1}
                  max={31}
                  inputMode="numeric"
                  value={form.dia1}
                  aria-required="true"
                  aria-invalid={!!errors.dia1}
                  onChange={cambiar("dia1")}
                />
                {errors.dia1 && <p className="field-error" role="alert">{errors.dia1}</p>}
              </div>
              <div className="field">
                <label htmlFor="perfil-dia2">Segundo día (opcional)</label>
                <input
                  id="perfil-dia2"
                  type="number"
                  min={1}
                  max={31}
                  inputMode="numeric"
                  value={form.dia2}
                  aria-invalid={!!errors.dia2}
                  onChange={cambiar("dia2")}
                />
                {errors.dia2 ? (
                  <p className="field-error" role="alert">{errors.dia2}</p>
                ) : (
                  <p className="required-note">Déjalo vacío si cobras una vez al mes.</p>
                )}
              </div>
            </div>

            <div className="edit-row" style={{ padding: 0 }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving && <span className="spinner" aria-hidden="true" />}
                Guardar cambios
              </button>
              <button type="button" className="btn-ghost" disabled={saving} onClick={() => setEditando(false)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="grid-2" style={{ marginTop: "0.75rem" }}>
            <div>
              <div className="row-sub">NOMBRE PARA MOSTRAR</div>
              <strong>{displayName}</strong>
            </div>
            <div>
              <div className="row-sub">UNIVERSIDAD</div>
              <strong>{p.universidad || "Sin definir"}</strong>
            </div>
            <div>
              <div className="row-sub">QUINCENA</div>
              <strong>{describirQuincena(p.quincenaDias)}</strong>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: "1.25rem" }}>
        <h3>Preferencias</h3>
        <div className="pref-row">
          <div className="row-left">
            <div className="row-icon"><Moon size={16} aria-hidden="true" /></div>
            <div>
              <div className="row-title">Tema oscuro</div>
              <div className="row-sub">Descansa la vista de noche. Se guarda en tu perfil.</div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            className="switch"
            aria-checked={theme === "dark"}
            aria-label="Tema oscuro"
            onClick={toggleTheme}
          />
        </div>
        <AvisosNavegador />
      </div>

      <div className="card" style={{ marginTop: "1.25rem" }}>
        <h3>Insignias obtenidas</h3>
        <div className="badges stagger">
          {(p.insignias || []).map((i, idx) => (
            <div className="badge-item" key={i} style={{ "--i": idx }}>
              <Award size={15} aria-hidden="true" /> {i}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Perfil;
