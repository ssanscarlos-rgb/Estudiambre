import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Scale, PlusCircle, Target, User, Flame, Bell, Moon, Sun, HelpCircle, LogOut } from "lucide-react";
import { apiGet } from "../api";
import useApi from "../hooks/useApi";
import { useAuth } from "../auth";
import { iniciales } from "../format";
import NotificationsPanel from "./NotificationsPanel";
import HelpModal from "./HelpModal";
import Logo from "./Logo";

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
  const { user, signOut } = useAuth();
  const { data: perfil } = useApi(fetchPerfil);
  const { data: notificaciones, loading: loadingNotif, error: errorNotif, reload: reloadNotif } =
    useApi(fetchNotificaciones);
  const [theme, setTheme] = useState(initialTheme);
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const lastNavRef = useRef(0);

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

  // Cambiar de panel con la rueda del mouse (arriba/abajo), pero solo
  // cuando no queda nada que hacer scroll dentro de un contenedor con
  // overflow (como el dropdown de notificaciones o una lista larga) —
  // así no se "roba" el scroll normal de la página.
  useEffect(() => {
    const THRESHOLD = 35;
    const COOLDOWN = 650;

    const scrollableAncestorHasRoom = (target, deltaY) => {
      let el = target;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        const canScrollHere =
          (style.overflowY === "auto" || style.overflowY === "scroll") && el.scrollHeight > el.clientHeight + 1;
        if (canScrollHere) {
          if (deltaY > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
          if (deltaY < 0 && el.scrollTop > 1) return true;
        }
        el = el.parentElement;
      }
      return false;
    };

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < THRESHOLD) return;
      if (scrollableAncestorHasRoom(e.target, e.deltaY)) return;

      const now = Date.now();
      if (now - lastNavRef.current < COOLDOWN) return;

      const currentIndex = links.findIndex((l) =>
        l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)
      );
      if (currentIndex === -1) return;

      const nextIndex = currentIndex + (e.deltaY > 0 ? 1 : -1);
      if (nextIndex < 0 || nextIndex >= links.length) return;

      lastNavRef.current = now;
      navigate(links[nextIndex].to);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [location.pathname, navigate]);

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
                <div className="full-name">{user.name?.split(" ")[0]}</div>
                <div className="sub" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {perfil?.universidad || user.email}
                </div>
              </div>
              <button type="button" className="icon-btn" onClick={signOut} aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut size={15} />
              </button>
            </div>
          )}
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
        </div>
      </main>

      {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

export default Layout;
