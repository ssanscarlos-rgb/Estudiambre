import React from "react";
import { useOutletContext } from "react-router-dom";
import { Moon, Award } from "lucide-react";
import { apiGet } from "../api";
import useApi from "../hooks/useApi";
import PageHeader from "../components/PageHeader";
import ErrorState from "../components/ErrorState";
import { Skeleton } from "../components/Skeleton";
import { iniciales } from "../format";

const fetchPerfil = () => apiGet("perfil");

function Perfil() {
  const { data: p, error, loading, reload } = useApi(fetchPerfil);
  const { theme, toggleTheme } = useOutletContext();
  const subtitle = "Tus datos y preferencias";

  if (error) {
    return (
      <>
        <PageHeader title="Perfil" subtitle={subtitle} />
        <ErrorState error={error} onRetry={reload} />
      </>
    );
  }

  if (loading || !p) {
    return (
      <>
        <PageHeader title="Perfil" subtitle={subtitle} />
        <Skeleton h={100} r={14} />
        <div className="grid-2">
          <Skeleton h={80} r={14} />
          <Skeleton h={80} r={14} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Perfil" subtitle={subtitle} />

      <div className="card mb" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <div className="avatar" style={{ width: 56, height: 56, fontSize: "1.2rem" }}>{iniciales(p.nombre)}</div>
        <div>
          <strong>{p.nombre}</strong>
          <div className="row-sub">{p.correo}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 0 }}>
        <div className="card">
          <div className="row-sub">UNIVERSIDAD</div>
          <strong>{p.universidad}</strong>
        </div>
        <div className="card">
          <div className="row-sub">QUINCENA</div>
          <strong>{p.quincenaDias}</strong>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1.25rem" }}>
        <h3>Preferencias</h3>
        <div className="pref-row">
          <div className="row-left">
            <div className="row-icon"><Moon size={16} aria-hidden="true" /></div>
            <div>
              <div className="row-title">Tema oscuro</div>
              <div className="row-sub">Descansa la vista de noche</div>
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
