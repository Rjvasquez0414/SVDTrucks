'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para mantener la conexion con Supabase activa
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
      // Silenciar
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      console.log('[KeepAlive] Online - ping');
      ping();
    };

    window.addEventListener('online', handleOnline);
    return () => {
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
