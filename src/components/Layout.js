import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Scale, PlusCircle, Target, User, Flame, Bell, Moon, Sun, HelpCircle, LogOut } from "lucide-react";
import { apiGet, apiPatch } from "../api";
import useApi from "../hooks/useApi";
import useNotificaciones from "../hooks/useNotificaciones";
import { useAuth } from "../auth";
import { useToast } from "./Toast";
import { iniciales } from "../format";
import NotificationsPanel from "./NotificationsPanel";
import HelpModal from "./HelpModal";
import Logo from "./Logo";
import ErrorBoundary from "./ErrorBoundary";
import { destinoDe } from "../notificaciones";

const links = [
  { to: "/", label: "Panel", Icon: LayoutDashboard, end: true },
  { to: "/comparar", label: "Comparar", Icon: Scale },
  { to: "/registrar", label: "Registrar", Icon: PlusCircle },
  { to: "/plan", label: "Plan", Icon: Target },
  { to: "/notificaciones", label: "Notificaciones", Icon: Bell, soloEscritorio: true },
  { to: "/perfil", label: "Perfil", Icon: User },
];

const fetchPerfil = () => apiGet("perfil");

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
  const notif = useNotificaciones();
  const [theme, setTheme] = useState(initialTheme);
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
    const destino = destinoDe(n);
    if (destino) navigate(destino);
  };

  // Aviso discreto cuando llega una notificación en tiempo real.
  const ultimaLlegada = useRef(null);
  useEffect(() => {
    const l = notif.llegada;
    if (!l || ultimaLlegada.current === l.k) return;
    ultimaLlegada.current = l.k;
    toast.info(l.n.titulo ? `Nueva notificación: ${l.n.titulo}` : "Tienes una notificación nueva");
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
              className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "") + (l.soloEscritorio ? " solo-escritorio" : "")}
            >
              <l.Icon size={18} className="nav-icon" aria-hidden="true" />
              <span>{l.label}</span>
              {l.to === "/notificaciones" && unread > 0 && (
                <span className="nav-badge" aria-label={`${unread} sin leer`}>{unread > 9 ? "9+" : unread}</span>
              )}
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

      <main className="main">
        <div className="main-inner">
          <div className="header-actions">
            {perfil && (
              <span className="badge-streak">
                <Flame size={14} aria-hidden="true" /> Racha: {perfil.racha} días
              </span>
            )}

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

            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>

          <div className="page-enter" key={location.pathname}>
            <ErrorBoundary key={location.pathname}>
              <Outlet
                context={{ theme, toggleTheme, perfil, setPerfil, perfilLoading, perfilError, reloadPerfil, displayName, notif }}
              />
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

export default Layout;
