'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook para recargar datos cuando el usuario vuelve a la pestaña
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

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastFetch = Date.now() - lastFetchRef.current;

        if (timeSinceLastFetch > staleTimeMs) {
          console.log(`[RefetchOnFocus] Recargando (${Math.round(timeSinceLastFetch / 1000)}s inactivo)`);
          lastFetchRef.current = Date.now();
          try {
            await refetchFn();
          } catch (err) {
            console.error('[RefetchOnFocus] Error:', err);
          }
        }
      }
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
