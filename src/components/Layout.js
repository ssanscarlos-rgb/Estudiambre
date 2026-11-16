import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Scale, PlusCircle, Target, User, Flame, Bell, HelpCircle, LogOut } from "lucide-react";
import { apiGet, apiPatch, apiPost } from "../api";
import useApi from "../hooks/useApi";
import useNotificaciones from "../hooks/useNotificaciones";
import { useAuth } from "../auth";
import { useToast } from "./Toast";
import { iniciales } from "../format";
import NotificationsPanel from "./NotificationsPanel";
import HelpModal from "./HelpModal";
import Bienvenida from "./Bienvenida";
import RachaJuego from "./RachaJuego";
import Logo from "./Logo";
import ErrorBoundary from "./ErrorBoundary";
import { destinoDe } from "../notificaciones";
import { activados as avisosActivados, mostrar as mostrarAvisoNavegador } from "../avisosNavegador";
import { suscribirPush } from "../pushWeb";

const links = [
  { to: "/", label: "Panel", Icon: LayoutDashboard, end: true },
  { to: "/comparar", label: "Comparar", Icon: Scale },
  { to: "/registrar", label: "Registrar", Icon: PlusCircle },
  { to: "/plan", label: "Plan", Icon: Target },
  { to: "/perfil", label: "Perfil", Icon: User },
];

const fetchPerfil = () => apiGet("perfil");

// Respaldo local del "ya configuró su plan": evita que el asistente reaparezca si el PATCH al perfil falló.
const claveOnboarding = (email) => `estudiambre_onboarded_${email || "anon"}`;
const leerOnboarding = (email) => {
  try {
    return localStorage.getItem(claveOnboarding(email)) === "1";
  } catch {
    return false;
  }
};
const guardarOnboarding = (email, valor) => {
  try {
    if (valor) localStorage.setItem(claveOnboarding(email), "1");
    else localStorage.removeItem(claveOnboarding(email));
  } catch {
    /* sin acceso a localStorage */
  }
};
const fetchPlan = () => apiGet("plan");

function initialTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* sin acceso a localStorage */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function Layout() {
  const { user, signOut } = useAuth();
  const toast = useToast();
  // El perfil se pide UNA vez aquí y se comparte con las páginas por el
  // contexto del Outlet (antes Perfil lo volvía a descargar).
  const { data: perfil, setData: setPerfil, loading: perfilLoading, error: perfilError, reload: reloadPerfil } =
    useApi(fetchPerfil);
  // El plan también se pide una vez aquí: Plan lo edita y Registrar usa sus categorías.
  const { data: plan, setData: setPlan, loading: planLoading, error: planError, reload: reloadPlan } = useApi(fetchPlan);
  const notif = useNotificaciones();
  const [theme, setTheme] = useState(initialTheme);
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [configurado, setConfigurado] = useState(() => leerOnboarding(user?.email));

  // Primera vez: el perfil todavía no está marcado como configurado → asistente de bienvenida.
  const mostrarBienvenida = !!perfil && !perfilLoading && !planLoading && perfil.preferencias?.onboarded !== true && !configurado;

  // Racha: el minijuego sale al entrar si hoy todavía no se encendió (lo decide ms-perfil con la
  // fecha de Costa Rica). Si se cierra, se puede abrir de nuevo tocando la racha.
  const [rachaCerrada, setRachaCerrada] = useState(false);
  const [rachaRecien, setRachaRecien] = useState(false);
  const rachaEncendida = useRef(null); // respuesta del POST, se aplica al cerrar el minijuego
  const rachaPendiente = !!perfil && perfil.rachaEncendidaHoy === false;
  const mostrarRacha = rachaPendiente && !perfilLoading && !mostrarBienvenida && !rachaCerrada;
  const encenderRacha = async () => {
    const p = await apiPost("perfil/racha");
    rachaEncendida.current = p;
    return p;
  };
  // Al cerrar: si se encendió, se actualiza el perfil y el fueguito del encabezado se anima.
  const cerrarRacha = () => {
    setRachaCerrada(true);
    if (rachaEncendida.current) {
      setPerfil(rachaEncendida.current);
      rachaEncendida.current = null;
      setRachaRecien(true);
    }
  };

  // A la medianoche de Costa Rica (UTC−6) se vuelve a pedir el perfil: si la app quedó abierta,
  // aparece el minijuego del día nuevo. Al volver a la pestaña también se revisa, porque el
  // navegador puede atrasar los temporizadores de las pestañas en segundo plano.
  const diaCargado = useRef(null);
  useEffect(() => {
    if (!perfil) return undefined;
    const DIA = 86400000, CR = 6 * 3600000;
    const diaCR = () => Math.floor((Date.now() - CR) / DIA);
    diaCargado.current = diaCR();
    const nuevoDia = () => {
      setRachaCerrada(false);
      setRachaRecien(false);
      reloadPerfil();
    };
    const espera = (diaCR() + 1) * DIA + CR - Date.now() + 2000;
    const t = setTimeout(nuevoDia, espera);
    const alVolver = () => {
      if (document.visibilityState === "visible" && diaCR() !== diaCargado.current) nuevoDia();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearTimeout(t);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [perfil, reloadPerfil]);

  const marcarConfigurado = async (extra = {}) => {
    setConfigurado(true);
    guardarOnboarding(user?.email, true);
    const preferencias = { onboarded: true, ...extra };
    setPerfil((p) => ({ ...p, preferencias: { ...p.preferencias, ...preferencias } }));
    try {
      await apiPatch("perfil", { preferencias });
    } catch {
      toast.info("No pudimos guardar tu preferencia en el servidor; la recordamos en este navegador.");
    }
  };
  const terminarBienvenida = async (nuevoPlan, extra) => {
    setPlan((p) => ({ ...(p || {}), ...nuevoPlan }));
    await marcarConfigurado(extra);
    reloadPlan();
    toast.success("¡Listo! Tu plan quedó configurado");
  };
  const omitirBienvenida = async () => {
    await marcarConfigurado();
    toast.info("Podés configurar tu plan cuando quieras desde Perfil");
  };
  // Perfil → "Volver a configurar".
  const reabrirBienvenida = async () => {
    setConfigurado(false);
    guardarOnboarding(user?.email, false);
    setPerfil((p) => ({ ...p, preferencias: { ...p.preferencias, onboarded: false } }));
    try {
      await apiPatch("perfil", { preferencias: { onboarded: false } });
    } catch {
      /* si falla, igual se reabre en esta sesión */
    }
  };
  const location = useLocation();
  const navigate = useNavigate();

  // Con la sesión iniciada y los avisos ya activados en este navegador, se (re)registra la
  // suscripción push para este usuario: por ejemplo, después de cerrar sesión y volver a entrar.
  useEffect(() => {
    if (avisosActivados()) suscribirPush().catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* sin acceso a localStorage */
    }
  }, [theme]);

  // El tema guardado en el perfil (preferencias.tema) manda al cargar, así
  // se conserva entre dispositivos.
  const temaDelPerfilAplicado = useRef(false);
  useEffect(() => {
    const guardado = perfil?.preferencias?.tema;
    if (!temaDelPerfilAplicado.current && (guardado === "light" || guardado === "dark")) {
      temaDelPerfilAplicado.current = true;
      setTheme(guardado);
    }
  }, [perfil]);

  const toggleTheme = () => {
    const siguiente = theme === "dark" ? "light" : "dark";
    setTheme(siguiente);
    if (!perfil) return;
    setPerfil((p) => ({ ...p, preferencias: { ...p.preferencias, tema: siguiente } }));
    // Silencioso: si falla igual queda guardado en este navegador (localStorage).
    apiPatch("perfil", { preferencias: { tema: siguiente } }).catch(() => {});
  };

  const displayName = perfil?.nombre?.trim() || user?.name || "";
  const unread = notif.items.filter((n) => !n.leida).length;
  const marcarLeida = (id) => notif.markRead(id).catch((e) => toast.error(e, "No se pudo marcar como leída"));

  // Tocar una notificación de la campana: la marca como leída y abre la pantalla a la que se refiere.
  const abrirNotificacion = (n) => {
    if (!n.leida) marcarLeida(n.id);
    setNotifOpen(false);
    navigate(destinoDe(n) || "/notificaciones");
  };

  // Al tocar un push (public/sw.js) la app se abre con ?notif=<id>: se marca como leída y se
  // limpia la URL (replace, para que "Atrás" no la repita).
  const { markRead } = notif;
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("notif");
    if (!id) return;
    markRead(id).catch(() => {});
    params.delete("notif");
    const resto = params.toString();
    navigate({ pathname: location.pathname, search: resto ? `?${resto}` : "" }, { replace: true });
  }, [location.search, location.pathname, markRead, navigate]);

  // El aviso de la pestaña usa la versión más reciente de abrirNotificacion sin volver a correr el efecto.
  const abrirRef = useRef(abrirNotificacion);
  abrirRef.current = abrirNotificacion;

  // Aviso discreto cuando llega una notificación en tiempo real.
  const ultimaLlegada = useRef(null);
  useEffect(() => {
    const l = notif.llegada;
    if (!l || ultimaLlegada.current === l.k) return;
    ultimaLlegada.current = l.k;
    // Con la pestaña oculta, aviso nativo del navegador (si el usuario lo activó); a la vista, el toast.
    if (document.hidden && mostrarAvisoNavegador(l.n, () => abrirRef.current(l.n))) return;
    toast.info(l.n.titulo ? `Nueva notificación: ${l.n.titulo}` : "Tenés una notificación nueva");
  }, [notif.llegada, toast]);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Logo src={perfil?.logoUrl} />
          <div>
            <div className="name">EstudiAmbre</div>
            <div className="tagline">Tu plata, sin estrés</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Principal">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
            >
              <l.Icon size={18} className="nav-icon" aria-hidden="true" />
              <span>{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {user && (
            <div className="sidebar-footer">
              {user.picture ? (
                <img className="avatar avatar-img" src={user.picture} alt="" referrerPolicy="no-referrer" />
              ) : (
                <div className="avatar">{iniciales(user.name)}</div>
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="full-name">{displayName.split(" ")[0]}</div>
                <div className="sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {perfil?.universidad || user.email}
                </div>
              </div>
              <button type="button" className="icon-btn" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut size={15} />
              </button>
            </div>
          )}
        {process.env.REACT_APP_VERSION && <div className="version">{process.env.REACT_APP_VERSION}</div>}
        </div>
      </aside>

      <main className={"main" + (location.pathname === "/comparar" ? " main-fijo" : "")}>
        <div className="main-inner">
          <div className="header-actions">
            {perfil &&
              (rachaPendiente ? (
                <button
                  type="button"
                  className="badge-streak apagada"
                  title="Encendé tu racha de hoy"
                  onClick={() => setRachaCerrada(false)}
                >
                  <Flame size={14} aria-hidden="true" /> Racha: {perfil.racha} {perfil.racha === 1 ? "día" : "días"}
                </button>
              ) : (
                <span className={"badge-streak" + (rachaRecien ? " recien" : "")}>
                  <Flame size={14} aria-hidden="true" /> Racha: {perfil.racha} {perfil.racha === 1 ? "día" : "días"}
                </span>
              ))}

            <button
              type="button"
              className="icon-btn"
              aria-label="Ayuda"
              title="Cómo funciona la app"
              onClick={() => setHelpOpen(true)}
            >
              <HelpCircle size={17} />
            </button>

            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="icon-btn"
                aria-label="Notificaciones"
                aria-haspopup="true"
                aria-expanded={notifOpen}
                onClick={() => setNotifOpen((v) => !v)}
              >
                <Bell size={17} />
                {unread > 0 && <span className="dot" />}
              </button>
              {notifOpen && (
                <NotificationsPanel notif={notif} onOpen={abrirNotificacion} onClose={() => setNotifOpen(false)} />
              )}
            </div>
          </div>

          <div className="page-enter" key={location.pathname}>
            <ErrorBoundary key={location.pathname}>
              <Outlet
                context={{ theme, toggleTheme, perfil, setPerfil, perfilLoading, perfilError, reloadPerfil, displayName, notif, plan, setPlan, planLoading, planError, reloadPlan, reabrirBienvenida }}
              />
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {mostrarBienvenida && <Bienvenida plan={plan} onTerminar={terminarBienvenida} onOmitir={omitirBienvenida} />}
      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
      {mostrarRacha && !helpOpen && (
        <RachaJuego
          nombre={(displayName || "").split(" ")[0]}
          rachaPerdida={perfil.rachaPerdida || 0}
          onEncender={encenderRacha}
          onCerrar={cerrarRacha}
        />
      )}
    </div>
  );
}

export default Layout;
