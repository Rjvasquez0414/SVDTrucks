'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para mantener la conexion con Supabase activa
 * - Hace ping cada 4 minutos para evitar que el pooler cierre la conexion
 * - Reconecta automaticamente cuando el usuario vuelve a la pestaña
 * - Detecta cuando el navegador vuelve online
 */
export function useSupabaseKeepAlive(intervalMs = 4 * 60 * 1000) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingRef = useRef<number>(Date.now());

  // Funcion de ping ligera - solo verifica que la conexion funcione
  const ping = useCallback(async () => {
    try {
      const start = Date.now();
      // Query muy ligera - solo cuenta 1 registro
      const { error } = await supabase
        .from('vehiculos')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      if (!error) {
        lastPingRef.current = Date.now();
        console.log(`[KeepAlive] Ping OK (${Date.now() - start}ms)`);
        return true;
      } else {
        console.warn('[KeepAlive] Ping fallido:', error.message);
        return false;
      }
    } catch (err) {
      console.error('[KeepAlive] Error en ping:', err);
      return false;
    }
  }, []);

  // Reconexion cuando la pestaña vuelve a ser visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const timeSinceLastPing = Date.now() - lastPingRef.current;

        // Si paso mas de 1 minuto desde el ultimo ping, verificar conexion
        if (timeSinceLastPing > 60_000) {
          console.log('[KeepAlive] Pestaña activa - verificando conexion...');
          await ping();
        }
      }
    };

    // Reconexion cuando el navegador vuelve online
    const handleOnline = () => {
      console.log('[KeepAlive] Conexion restaurada - haciendo ping...');
      ping();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [ping]);

  // Ping periodico
  useEffect(() => {
    // Ping inicial
    ping();

    // Configurar intervalo
    intervalRef.current = setInterval(() => {
      // Solo hacer ping si la pestaña esta visible
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
