import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Scale, PlusCircle, Target, User, Flame, Bell, Moon, Sun, HelpCircle } from "lucide-react";
import { apiGet } from "../api";
import useApi from "../hooks/useApi";
import { iniciales } from "../format";
import NotificationsPanel from "./NotificationsPanel";
import HelpModal from "./HelpModal";

const links = [
  { to: "/", label: "Panel", Icon: LayoutDashboard, end: true },
  { to: "/comparar", label: "Comparar", Icon: Scale },
  { to: "/registrar", label: "Registrar", Icon: PlusCircle },
  { to: "/plan", label: "Plan", Icon: Target },
  { to: "/perfil", label: "Perfil", Icon: User },
];

const fetchPerfil = () => apiGet("perfil");
const fetchNotificaciones = () => apiGet("notificaciones");

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
  const { data: perfil } = useApi(fetchPerfil);
  const { data: notificaciones, loading: loadingNotif, error: errorNotif, reload: reloadNotif } =
    useApi(fetchNotificaciones);
  const [theme, setTheme] = useState(initialTheme);
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* sin acceso a localStorage */
    }
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const unread = (notificaciones || []).filter((n) => !n.leida).length;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo">E</div>
          <div>
            <div className="name">EstudiAmb</div>
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
          {perfil && (
            <div className="sidebar-footer">
              <div className="avatar">{iniciales(perfil.nombre)}</div>
              <div>
                <div className="full-name">{perfil.nombre?.split(" ")[0]}</div>
                <div className="sub">{perfil.universidad}</div>
              </div>
            </div>
          )}
          <div className="version">v{process.env.REACT_APP_VERSION || "dev"}</div>
        </div>
      </aside>

      <main className="main">
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
              <NotificationsPanel
                data={notificaciones}
                loading={loadingNotif}
                error={errorNotif}
                onRetry={reloadNotif}
                onClose={() => setNotifOpen(false)}
              />
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
          <Outlet context={{ theme, toggleTheme }} />
        </div>
      </main>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

export default Layout;
