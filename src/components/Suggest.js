import React, { useId, useMemo, useState } from "react";

// input controlado por fuera (value/onChange los maneja el padre) + un
// desplegable de coincidencias sobre `options`. No depende de datalist
// nativo para poder mantener el mismo estilo en todos los navegadores.
function Suggest({ value, onChange, options, placeholder, ariaLabel, inputProps = {}, onPick }) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    return options.filter((o) => o.toLowerCase().includes(q) && o.toLowerCase() !== q).slice(0, 6);
  }, [value, options]);

  const pick = (opt) => {
    onChange(opt);
    setOpen(false);
    onPick?.(opt);
  };

  return (
    <div className="suggest-wrap">
      <input
        type="search"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-expanded={open && matches.length > 0}
        aria-controls={listId}
        role="combobox"
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        {...inputProps}
      />
      {open && matches.length > 0 && (
        <ul className="suggest-list" role="listbox" id={listId}>
          {matches.map((m) => (
            <li key={m}>
              {/* onMouseDown en vez de onClick: dispara antes del blur del input */}
              <button type="button" role="option" aria-selected="false" onMouseDown={() => pick(m)}>
                {m}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Suggest;
