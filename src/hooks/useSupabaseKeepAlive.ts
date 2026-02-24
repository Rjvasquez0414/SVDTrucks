'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para mantener la conexion con Supabase activa
 * - Hace ping al volver a la pestaña (warmup de conexion)
 * - Hace ping cada 4 minutos
 * - Reconecta cuando el navegador vuelve online
 */
export function useSupabaseKeepAlive(intervalMs = 4 * 60 * 1000) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const ping = useCallback(async () => {
    try {
      const start = Date.now();
      const { error } = await supabase
        .from('vehiculos')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      if (!error) {
        console.log(`[KeepAlive] Ping OK (${Date.now() - start}ms)`);
      }
    } catch {
      // Silenciar - el fetchWithRetry ya maneja reintentos
    }
  }, []);

  // Warmup: al volver a la pestaña, hacer ping inmediato para
  // forzar al navegador a abrir una conexion TCP fresca
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };

    const handleOnline = () => {
      console.log('[KeepAlive] Online - ping');
      ping();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [ping]);

  useEffect(() => {
    ping();

    intervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ping, intervalMs]);
}
