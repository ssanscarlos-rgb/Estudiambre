import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPatch } from "../api";

const SIZE = 10;

const resumen = (res) => ({ page: res.page ?? 0, totalPages: res.totalPages ?? 1 });

// Notificaciones de la campana: trae la página 0 y "Cargar más" agrega las
// siguientes (página base 0). Lo que llegue en tiempo real entra arriba con
// `prepend` (lo usará el cliente de SignalR cuando esté listo).
export default function useNotificaciones() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [errorMore, setErrorMore] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet(`notificaciones?page=0&size=${SIZE}`)
      .then((res) => {
        setItems(res.content || []);
        setMeta(resumen(res));
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasMore = !!meta && meta.page + 1 < meta.totalPages;

  const loadMore = useCallback(() => {
    if (!meta || loadingMore || meta.page + 1 >= meta.totalPages) return;
    setLoadingMore(true);
    setErrorMore(null);
    apiGet(`notificaciones?page=${meta.page + 1}&size=${SIZE}`)
      .then((res) => {
        setItems((prev) => {
          const ya = new Set(prev.map((n) => n.id));
          return [...prev, ...(res.content || []).filter((n) => !ya.has(n.id))];
        });
        setMeta(resumen(res));
      })
      .catch(setErrorMore)
      .finally(() => setLoadingMore(false));
  }, [meta, loadingMore]);

  // Marca como leída al instante y deshace el cambio si el PATCH falla.
  const markRead = useCallback(async (id) => {
    const marcar = (leida) => setItems((prev) => prev.map((n) => (n.id === id ? { ...n, leida } : n)));
    marcar(true);
    try {
      await apiPatch(`notificaciones/${id}`, { leida: true });
    } catch (e) {
      marcar(false);
      throw e;
    }
  }, []);

  const prepend = useCallback((n) => {
    setItems((prev) => (prev.some((x) => x.id === n.id) ? prev : [n, ...prev]));
  }, []);

  return { items, loading, error, reload: load, hasMore, loadMore, loadingMore, errorMore, markRead, prepend };
}
