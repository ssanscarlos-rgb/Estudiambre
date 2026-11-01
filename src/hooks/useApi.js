import { useCallback, useEffect, useState } from "react";

// fetcher debe ser una función estable (definida fuera del componente).
// Al recargar se conserva `data` anterior: si el reintento falla, la pantalla
// sigue mostrando lo que ya tenía y `error` solo agrega la franja de aviso.
export default function useApi(fetcher) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, setData, error, loading, reload: load };
}
