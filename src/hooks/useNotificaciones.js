import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPatch } from "../api";
import { normalizarPagina } from "../pagina";
import { conectarNotificaciones } from "../realtime";
import { normalizarNotificacion } from "../notificaciones";

const SIZE = 10;

const resumen = (res) => ({ page: res.page ?? 0, totalPages: res.totalPages ?? 1 });

// Notificaciones de la campana: trae la página 0 y "Cargar más" agrega las
// siguientes (página base 0). Lo que llega en tiempo real (Azure SignalR,
// ver src/realtime.js) entra arriba con `prepend`.
export default function useNotificaciones() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [errorMore, setErrorMore] = useState(null);
  // Última notificación llegada en tiempo real (la usan el aviso y la página de Notificaciones).
  const [llegada, setLlegada] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet(`notificaciones?page=0&size=${SIZE}`)
      .then((respuesta) => {
        const res = normalizarPagina(respuesta, SIZE, 0);
        setItems(res.content);
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
      .then((respuesta) => {
        const res = normalizarPagina(respuesta, SIZE, meta.page + 1);
        setItems((prev) => {
          const ya = new Set(prev.map((n) => n.id));
          return [...prev, ...res.content.filter((n) => !ya.has(n.id))];
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

  // Elimina al instante y la devuelve a su lugar si el DELETE falla.
  const remove = useCallback(async (id) => {
    let anterior = null;
    setItems((prev) => {
      anterior = prev;
      return prev.filter((n) => n.id !== id);
    });
    try {
      await apiDelete(`notificaciones/${id}`);
    } catch (e) {
      setItems((prev) => (prev.some((n) => n.id === id) || !anterior ? prev : anterior));
      throw e;
    }
  }, []);

  // Entrada del tiempo real: la agrega arriba y avisa que llegó una nueva.
  const alLlegar = useCallback(
    (nueva) => {
      const n = normalizarNotificacion(nueva);
      prepend(n);
      setLlegada({ n, k: Date.now() });
    },
    [prepend]
  );

  // Tiempo real: las notificaciones nuevas entran arriba sin recargar.
  // Si la conexión se cae y no logra reconectar sola, se reintenta con
  // espera creciente (30 s → 5 min). Si el backend no tiene `negotiate`
  // (por ejemplo, la API sigue en mocks), no insiste.
  useEffect(() => {
    let activo = true;
    let conexion = null;
    let timer = null;
    let espera = 30_000;

    const reintentar = () => {
      if (!activo) return;
      timer = setTimeout(iniciar, espera);
      espera = Math.min(espera * 2, 300_000);
    };

    function iniciar() {
      conectarNotificaciones({
        onNotificacion: alLlegar,
        // Al volver, recarga la página 0 por si llegó algo mientras estuvo caída.
        onReconectado: load,
        onCerrada: reintentar,
      })
        .then((c) => {
          if (!activo) {
            c.stop();
            return;
          }
          conexion = c;
          espera = 30_000;
        })
        .catch((e) => {
          if (e?.status === 404 || e?.status === 405) return;
          reintentar();
        });
    }

    iniciar();
    return () => {
      activo = false;
      clearTimeout(timer);
      conexion?.stop();
    };
  }, [alLlegar, load]);

  return { items, loading, error, reload: load, hasMore, loadMore, loadingMore, errorMore, markRead, remove, prepend, llegada };
}
