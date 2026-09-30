import React, { useState } from "react";

function Logo({ size = 34 }) {
  const [fallback, setFallback] = useState(false);

  if (fallback) {
    return (
      <div className="logo" style={{ width: size, height: size }}>
        E
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="EstudiAmbre"
      className="logo-img"
      style={{ width: size, height: size }}
      onError={() => setFallback(true)}
    />
  );
}

export default Logo;
