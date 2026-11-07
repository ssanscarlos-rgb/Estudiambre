import React from "react";

// Paginador para respuestas { content, page, size, totalElements, totalPages }
// con página base 0. `page` en la UI se muestra desde 1.
function Pager({ data, onPage, busy, noun = "resultados" }) {
  if (!data) return null;
  const totalPages = Math.max(1, data.totalPages || 1);
  const actual = data.page ?? 0;
  return (
    <div className="pagination">
      <span className="row-sub">
        Página {actual + 1} de {totalPages} · {data.totalElements ?? 0} {noun}
      </span>
      <div className="pager">
        <button type="button" className="btn-ghost" disabled={busy || actual <= 0} onClick={() => onPage(actual - 1)}>
          ← Anterior
        </button>
        <span>{actual + 1} / {totalPages}</span>
        <button type="button" className="btn-ghost" disabled={busy || actual + 1 >= totalPages} onClick={() => onPage(actual + 1)}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}

export default Pager;
