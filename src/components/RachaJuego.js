import React, { useEffect, useRef, useState } from "react";
import { Flame, PiggyBank, X } from "lucide-react";

// Minijuego diario para encender la racha: arrastrar las monedas al chanchito.
// Funciona con mouse y con el dedo (pointer events). Tocar una moneda o darle Enter
// también la mete, para quien no pueda arrastrar.
const MONEDAS = [
  { id: 1, x: 8, y: 14 },
  { id: 2, x: 26, y: 62 },
  { id: 3, x: 4, y: 108 },
  { id: 4, x: 52, y: 20 },
  { id: 5, x: 64, y: 100 },
];

function Moneda({ moneda, chanchitoRef, onDentro }) {
  const ref = useRef(null);
  const inicio = useRef(null);
  const [delta, setDelta] = useState({ x: 0, y: 0 });
  const [arrastrando, setArrastrando] = useState(false);

  const soltar = (e) => {
    if (!inicio.current) return;
    const movio = Math.abs(e.clientX - inicio.current.x) + Math.abs(e.clientY - inicio.current.y) > 6;
    inicio.current = null;
    setArrastrando(false);
    const caja = chanchitoRef.current?.getBoundingClientRect();
    const m = ref.current?.getBoundingClientRect();
    const dentro =
      caja && m &&
      m.left + m.width / 2 > caja.left - 12 && m.left + m.width / 2 < caja.right + 12 &&
      m.top + m.height / 2 > caja.top - 12 && m.top + m.height / 2 < caja.bottom + 12;
    if (dentro || !movio) onDentro(moneda.id);
    else setDelta({ x: 0, y: 0 });
  };

  return (
    <button
      ref={ref}
      type="button"
      className={"racha-moneda" + (arrastrando ? " arrastrando" : "")}
      style={{ left: moneda.x, top: moneda.y, transform: `translate(${delta.x}px, ${delta.y}px)` }}
      aria-label="Moneda: arrastrala al chanchito"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        inicio.current = { x: e.clientX, y: e.clientY };
        setArrastrando(true);
      }}
      onPointerMove={(e) => {
        if (inicio.current) setDelta({ x: e.clientX - inicio.current.x, y: e.clientY - inicio.current.y });
      }}
      onPointerUp={soltar}
      onPointerCancel={() => {
        inicio.current = null;
        setArrastrando(false);
        setDelta({ x: 0, y: 0 });
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onDentro(moneda.id);
        }
      }}
    >
      ₡
    </button>
  );
}

export default function RachaJuego({ nombre, rachaPerdida, onEncender, onCerrar }) {
  const [fase, setFase] = useState(rachaPerdida > 0 ? "perdida" : "juego");
  const [quedan, setQuedan] = useState(MONEDAS.map((m) => m.id));
  const [come, setCome] = useState(false);
  const [estado, setEstado] = useState({ enviando: false, error: false, racha: 0 });
  const chanchitoRef = useRef(null);

  const encender = async () => {
    setEstado({ enviando: true, error: false, racha: 0 });
    try {
      const perfil = await onEncender();
      setEstado({ enviando: false, error: false, racha: perfil?.racha ?? 1 });
      setFase("listo");
    } catch {
      setEstado({ enviando: false, error: true, racha: 0 });
    }
  };

  const meter = (id) => {
    setQuedan((q) => {
      const resto = q.filter((x) => x !== id);
      if (resto.length === 0 && q.length > 0) setTimeout(encender, 350);
      return resto;
    });
    setCome(true);
    setTimeout(() => setCome(false), 250);
  };

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCerrar]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="racha-titulo">
      <div className="modal-card racha-card">
        <button type="button" className="modal-close" aria-label="Cerrar" onClick={onCerrar}>
          <X size={16} />
        </button>

        {fase === "perdida" && (
          <>
            <div className="racha-llama apagada" aria-hidden="true"><Flame size={40} /></div>
            <h2 id="racha-titulo">Perdiste tu racha de {rachaPerdida} {rachaPerdida === 1 ? "día" : "días"}</h2>
            <p>Pero podés volver a empezar ahora mismo. Un día a la vez.</p>
            <button type="button" className="btn-primary" onClick={() => setFase("juego")}>Empezar de nuevo</button>
          </>
        )}

        {fase === "juego" && (
          <>
            <h2 id="racha-titulo">Encendé tu racha</h2>
            <p>Arrastrá las monedas al chanchito para empezar el día.</p>
            <div className="racha-juego">
              {MONEDAS.filter((m) => quedan.includes(m.id)).map((m) => (
                <Moneda key={m.id} moneda={m} chanchitoRef={chanchitoRef} onDentro={meter} />
              ))}
              <div ref={chanchitoRef} className={"racha-chanchito" + (come ? " come" : "")} aria-hidden="true">
                <PiggyBank size={84} strokeWidth={1.6} />
              </div>
            </div>
            <div className="racha-contador" aria-live="polite">
              {estado.enviando
                ? "Encendiendo…"
                : estado.error
                ? "No se pudo encender la racha."
                : `${MONEDAS.length - quedan.length} de ${MONEDAS.length} monedas`}
            </div>
            {estado.error && (
              <button type="button" className="btn-primary" onClick={encender}>Reintentar</button>
            )}
          </>
        )}

        {fase === "listo" && (
          <>
            <div className="racha-llama encendida" aria-hidden="true"><Flame size={48} /></div>
            <h2 id="racha-titulo">¡Bienvenido{nombre ? `, ${nombre}` : ""}!</h2>
            <p>
              ¡Que sea un día provechoso!
              <br />
              Llevás <strong>{estado.racha} {estado.racha === 1 ? "día" : "días"}</strong> de racha.
            </p>
            <button type="button" className="btn-primary" onClick={onCerrar} autoFocus>¡A darle!</button>
          </>
        )}
      </div>
    </div>
  );
}
