import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { apiGet } from "../api";

const links = [
  { to: "/", label: "Panel", end: true },
  { to: "/comparar", label: "Comparar" },
  { to: "/registrar", label: "Registrar" },
  { to: "/plan", label: "Plan" },
  { to: "/perfil", label: "Perfil" },
];

function iniciales(nombre) {
  if (!nombre) return "?";
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function Layout({ title, subtitle, children }) {
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    apiGet("perfil")
      .then(setPerfil)
      .catch(() => setPerfil(null));
  }, []);

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

        <nav className="sidebar-nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => "sidebar-link" + (isActive ? " active" : "")}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {perfil && (
          <div className="sidebar-footer">
            <div className="avatar">{iniciales(perfil.nombre)}</div>
            <div className="who">
              <div className="full-name">{perfil.nombre?.split(" ")[0]}</div>
              <div className="sub">{perfil.universidad}</div>
            </div>
          </div>
        )}
      </aside>

      <main className="main">
        <div className="page-header">
          <div>
            <h1>{title}</h1>
            {subtitle && <p className="subtitle">{subtitle}</p>}
          </div>
          <div className="header-actions">
            {perfil && <span className="badge-streak">🔥 Racha: {perfil.racha} días</span>}
            <div className="bell">
              🔔
              {perfil?.notificacionesNoLeidas > 0 && <span className="dot" />}
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}

export default Layout;
