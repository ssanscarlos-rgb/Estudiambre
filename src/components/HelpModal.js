import React, { useEffect, useState } from "react";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

const STEPS = [
  {
    title: "¡Bienvenida a EstudiAmbre!",
    text: "Te ayudamos a que tu plata de la quincena te alcance, y a encontrar dónde comprar más barato. Esto toma menos de un minuto.",
  },
  {
    title: "Registrá tus gastos",
    text: "Cada vez que gastes algo, anótalo en Registrar. Con la descripción, el monto y la categoría alcanza — el Panel se actualiza solo.",
  },
  {
    title: "Compará antes de comprar",
    text: "En Comparar buscás un producto y vemos dónde otros estudiantes lo encontraron más barato. Entre más reportes, más confiable.",
  },
];

function HelpModal({ onClose }) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar ayuda">
          <X size={18} />
        </button>

        <Sparkles size={22} className="modal-icon" aria-hidden="true" />
        <h2 id="help-title">{STEPS[step].title}</h2>
        <p>{STEPS[step].text}</p>

        <div className="modal-dots" aria-hidden="true">
          {STEPS.map((_, i) => (
            <span key={i} className={"dot-step" + (i === step ? " active" : "")} />
          ))}
        </div>

        <div className="modal-actions">
          {step > 0 ? (
            <button type="button" className="btn-ghost" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={16} /> Anterior
            </button>
          ) : (
            <button type="button" className="btn-ghost" onClick={onClose}>
              Saltar
            </button>
          )}

          {!last ? (
            <button type="button" className="btn-primary" onClick={() => setStep((s) => s + 1)}>
              Siguiente <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={onClose}>
              Listo, ¡vamos!
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
