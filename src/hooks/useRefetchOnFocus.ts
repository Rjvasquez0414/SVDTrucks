'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook para recargar datos cuando el usuario vuelve a la pestaña
 *
 * @param refetchFn - Funcion que recarga los datos
 * @param staleTimeMs - Tiempo en ms para considerar los datos "viejos" (default: 1 minuto)
 *
 * @example
 * ```tsx
 * const loadData = async () => {
 *   const data = await fetchData();
 *   setData(data);
 * };
 *
 * useRefetchOnFocus(loadData, 60_000); // Recarga si estuvo inactiva >1 min
 * ```
 */
export function useRefetchOnFocus(
  refetchFn: () => void | Promise<void>,
  staleTimeMs = 60_000
) {
  const lastFetchRef = useRef<number>(Date.now());
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Marcar el tiempo del primer fetch
    if (isFirstMount.current) {
      lastFetchRef.current = Date.now();
      isFirstMount.current = false;
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;

        // Solo refetch si los datos estan "viejos"
        if (timeSinceLastFetch > staleTimeMs) {
          console.log(`[RefetchOnFocus] Datos viejos (${Math.round(timeSinceLastFetch / 1000)}s) - recargando...`);
          lastFetchRef.current = Date.now();
          await refetchFn();
        }
      }
    };

    // Tambien refetch cuando vuelve online
    const handleOnline = async () => {
      console.log('[RefetchOnFocus] Conexion restaurada - recargando datos...');
      lastFetchRef.current = Date.now();
      await refetchFn();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [refetchFn, staleTimeMs]);

  // Funcion para marcar manualmente que se hizo fetch
  const markFetched = () => {
    lastFetchRef.current = Date.now();
  };

  return { markFetched };
}
