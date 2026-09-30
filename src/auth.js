import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { setAuthToken } from "./api";

const AuthContext = createContext(null);
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const STORAGE_KEY = "estudiambre_google_credential";

// Decodifica la parte payload de un JWT (sin verificar la firma; la
// verificación real la hace APIM con validate-jwt contra las llaves
// públicas de Google, esto es solo para mostrar nombre/foto en la UI).
function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

function isExpired(claims) {
  if (!claims?.exp) return true;
  return Date.now() >= claims.exp * 1000;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { name, email, picture, token }
  const [ready, setReady] = useState(false);
  const buttonRef = useRef(null);

  const applyCredential = (credential) => {
    const claims = decodeJwt(credential);
    if (!claims || isExpired(claims)) {
      setAuthToken(null);
      setUser(null);
      return;
    }
    setAuthToken(credential);
    setUser({ name: claims.name, email: claims.email, picture: claims.picture, token: credential });
    try {
      sessionStorage.setItem(STORAGE_KEY, credential);
    } catch {
      /* sin acceso a sessionStorage */
    }
  };

  const signOut = () => {
    setAuthToken(null);
    setUser(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sin acceso a sessionStorage */
    }
    window.google?.accounts.id.disableAutoSelect();
  };

  useEffect(() => {
    if (!CLIENT_ID) {
      // eslint-disable-next-line no-console
      console.error("Falta REACT_APP_GOOGLE_CLIENT_ID");
      setReady(true);
      return;
    }

    // Retoma sesión si había un token guardado y aún no expiró.
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) applyCredential(saved);
    } catch {
      /* sin acceso a sessionStorage */
    }

    const init = () => {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp) => applyCredential(resp.credential),
        auto_select: true,
      });
      setReady(true);
    };

    if (window.google?.accounts?.id) {
      init();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.head.appendChild(script);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready && !user && buttonRef.current && window.google?.accounts?.id) {
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "signin_with",
        locale: "es",
      });
    }
  }, [ready, user]);

  return (
    <AuthContext.Provider value={{ user, ready, signOut, buttonRef }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
