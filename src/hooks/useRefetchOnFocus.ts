'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook para recargar datos cuando el usuario vuelve a la pestaña.
 * Espera 800ms antes de refrescar para dar tiempo a que el navegador
 * restablezca las conexiones TCP que murieron en segundo plano.
 */
export function useRefetchOnFocus(
  refetchFn: () => void | Promise<void>,
  staleTimeMs = 60_000
) {
  const lastFetchRef = useRef<number>(Date.now());
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      lastFetchRef.current = Date.now();
      isFirstMount.current = false;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      const timeSinceLastFetch = Date.now() - lastFetchRef.current;
      if (timeSinceLastFetch <= staleTimeMs) return;

      // Esperar un momento para que el staleAbort en supabase.ts
      // limpie las conexiones muertas y el navegador abra nuevas
      setTimeout(async () => {
        // Verificar que la pestaña sigue visible
        if (document.visibilityState !== 'visible') return;

        console.log(`[RefetchOnFocus] Recargando (${Math.round(timeSinceLastFetch / 1000)}s inactivo)`);
        lastFetchRef.current = Date.now();
        try {
          await refetchFn();
        } catch (err) {
          console.error('[RefetchOnFocus] Error:', err);
        }
      }, 800);
    };

    const handleOnline = async () => {
      console.log('[RefetchOnFocus] Online - recargando');
      lastFetchRef.current = Date.now();
      try {
        await refetchFn();
      } catch (err) {
        console.error('[RefetchOnFocus] Error:', err);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [refetchFn, staleTimeMs]);

  const markFetched = () => {
    lastFetchRef.current = Date.now();
  };

  return { markFetched };
}
