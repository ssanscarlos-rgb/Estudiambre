import React from "react";
import { useAuth } from "../auth";
import Logo from "./Logo";

function LoginScreen() {
  const { buttonRef, ready } = useAuth();

  return (
    <div className="login-screen">
      <div className="login-card">
        <Logo size={48} />
        <h1>EstudiAmbre</h1>
        <p className="subtitle">Iniciá sesión con tu cuenta de Google para continuar.</p>
        <div ref={buttonRef} className="google-btn-slot" />
        {!process.env.REACT_APP_GOOGLE_CLIENT_ID && (
          <p className="field-error">
            Falta configurar REACT_APP_GOOGLE_CLIENT_ID en las variables de GitHub.
          </p>
        )}
        {process.env.REACT_APP_GOOGLE_CLIENT_ID && !ready && <p className="row-sub">Cargando…</p>}
      </div>
    </div>
  );
}

export default LoginScreen;
