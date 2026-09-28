import React from "react";

export function Skeleton({ h = 16, w = "100%", r = 8, style }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: r, ...style }} />;
}

export function ListSkeleton({ rows = 3 }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: rows }, (_, i) => (
        <div className="list-row" key={i}>
          <div className="row-left">
            <Skeleton h={32} w={32} style={{ marginRight: 12 }} />
            <div>
              <Skeleton h={12} w={140} />
              <Skeleton h={10} w={80} style={{ marginTop: 6 }} />
            </div>
          </div>
          <Skeleton h={12} w={50} />
        </div>
      ))}
    </div>
  );
}
