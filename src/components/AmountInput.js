import React from "react";
import { Plus, Minus } from "lucide-react";

function AmountInput({ value, onChange, step = 50, min = 0, placeholder, ariaLabel, ariaInvalid, ariaDescribedBy }) {
  const num = Number(value) || 0;

  const clamp = (n) => Math.max(min, n);

  const bump = (delta) => {
    onChange(String(clamp(num + delta)));
  };

  const handleType = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      onChange("");
      return;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) return;
    onChange(String(clamp(n)));
  };

  return (
    <div className="amount-input">
      <button
        type="button"
        className="amount-btn"
        onClick={() => bump(-step)}
        disabled={num <= min}
        aria-label={`Restar ${step}`}
      >
        <Minus size={15} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={handleType}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className="amount-field"
      />
      <button type="button" className="amount-btn" onClick={() => bump(step)} aria-label={`Sumar ${step}`}>
        <Plus size={15} />
      </button>
    </div>
  );
}

export default AmountInput;
