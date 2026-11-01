import { useCallback, useEffect, useState } from "react";
import { apiGet } from "../api";

// Pide UNA página a la vez: GET recurso?page=&size=&...params
// (página base 0; respuesta { content, page, size, totalElements, totalPages }).
// Cambiar `params` (búsqueda, producto) vuelve a la página 0. Mientras llega
// otra página se sigue mostrando la anterior, y si falla sigue ahí junto
// con `error`, para que la pantalla no se quede vacía.
export default function usePagedResource(resource, { size, params = {} }) {
  const key = JSON.stringify(params);
  const [pageState, setPageState] = useState({ key, page: 0 });
  const page = pageState.key === key ? pageState.page : 0;
  const setPage = useCallback((p) => setPageState({ key, page: p }), [key]);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    setError(null);

    const query = new URLSearchParams({ page, size });
    Object.entries(JSON.parse(key)).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") query.set(k, String(v).trim());
    });

    apiGet(`${resource}?${query}`)
      .then((res) => {
        if (cancelado) return;
        // Se borró el último elemento de la última página: retroceder una.
        if (res.content?.length === 0 && res.page > 0 && res.totalPages > 0) {
          setPage(res.totalPages - 1);
          return;
        }
        setData(res);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelado) return;
        setError(e);
        setLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, [resource, size, key, page, tick, setPage]);

  return { data, setData, loading, error, page, setPage, reload };
}
