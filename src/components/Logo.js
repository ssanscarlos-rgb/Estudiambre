import React, { useEffect, useState } from "react";

// `src` es la ubicación de la imagen. Si no se pasa (pantalla de login,
// donde todavía no hay sesión ni token para pedirle nada a la API), cae
// al archivo público local. Dentro de la app ya logueada, Layout.js le
// pasa la URL que trae el mock de /perfil (campo "logoUrl"), igual que
// el campo "image" del Lab 1.
const LOCAL_DEFAULT = "/logo.svg";

function Logo({ size = 34, src }) {
  const [fallback, setFallback] = useState(false);
  const effectiveSrc = src || LOCAL_DEFAULT;

  // Si cambia la URL (por ejemplo, ya cargó el mock), reintenta antes
  // de rendirse al fallback de la letra "E".
  useEffect(() => {
    setFallback(false);
  }, [effectiveSrc]);

  if (fallback) {
    return (
      <div className="logo" style={{ width: size, height: size }}>
        E
      </div>
    );
  }

  return (
    <img
      src={effectiveSrc}
      alt="EstudiAmbre"
      className="logo-img"
      style={{ width: size, height: size }}
      onError={() => setFallback(true)}
    />
  );
}

export default Logo;
