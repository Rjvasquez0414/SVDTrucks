'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook para recargar datos cuando el usuario vuelve a la pestaña
 *
 * @param refetchFn - Funcion que recarga los datos
 * @param staleTimeMs - Tiempo en ms para considerar los datos "viejos" (default: 1 minuto)
 *
 * NOTA: Agrega un delay antes del refetch para dar tiempo al auth-context
 * a refrescar el token primero (el handleVisibilityChange del auth se ejecuta
 * al mismo tiempo que este)
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
          // Esperar 1.5s para que el auth-context refresque el token primero
          // Si no esperamos, la query se hace con token expirado y falla
          await new Promise(resolve => setTimeout(resolve, 1500));

          console.log(`[RefetchOnFocus] Datos viejos (${Math.round(timeSinceLastFetch / 1000)}s) - recargando...`);
          lastFetchRef.current = Date.now();
          try {
            await refetchFn();
          } catch (err) {
            console.error('[RefetchOnFocus] Error recargando datos:', err);
          }
        }
      }
    };

    // Tambien refetch cuando vuelve online
    const handleOnline = async () => {
      // Esperar a que el token se refresque
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('[RefetchOnFocus] Conexion restaurada - recargando datos...');
      lastFetchRef.current = Date.now();
      try {
        await refetchFn();
      } catch (err) {
        console.error('[RefetchOnFocus] Error recargando datos:', err);
      }
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
