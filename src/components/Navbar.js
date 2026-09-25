import React from "react";
import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  marginRight: "1rem",
  textDecoration: "none",
  fontWeight: isActive ? "bold" : "normal",
  color: isActive ? "#0078d4" : "#333",
});

function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        padding: "1rem 2rem",
        borderBottom: "1px solid #ddd",
      }}
    >
      <NavLink to="/" style={linkStyle} end>
        Panel
      </NavLink>
      <NavLink to="/comparar" style={linkStyle}>
        Comparar
      </NavLink>
      <NavLink to="/registrar" style={linkStyle}>
        Registrar
      </NavLink>
      <NavLink to="/plan" style={linkStyle}>
        Plan
      </NavLink>
      <NavLink to="/perfil" style={linkStyle}>
        Perfil
      </NavLink>
    </nav>
  );
}

export default Navbar;
