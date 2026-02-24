'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Hook para mantener la conexion con Supabase activa
 * - Refresca el token periodicamente para evitar que expire
 * - Reconecta automaticamente cuando el usuario vuelve a la pestaña
 * - Detecta cuando el navegador vuelve online
 *
 * NOTA: El manejo de visibilitychange para AUTH se hace en auth-context.tsx
 * Este hook solo se encarga del keep-alive de datos (ping ligero)
 */
export function useSupabaseKeepAlive(intervalMs = 4 * 60 * 1000) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPingRef = useRef<number>(Date.now());

  // Ping ligero - solo verifica que la conexion funcione
  const ping = useCallback(async () => {
    try {
      const start = Date.now();
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

  // Reconexion cuando el navegador vuelve online
  useEffect(() => {
    const handleOnline = async () => {
      console.log('[KeepAlive] Conexion restaurada - refrescando sesion y haciendo ping...');
      // Forzar refresh del token cuando vuelve la conexion
      try {
        await supabase.auth.refreshSession();
      } catch {
        // Silenciar - el auth-context se encargara
      }
      ping();
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [ping]);

  // Ping periodico + refresh de token
  useEffect(() => {
    // Ping inicial
    ping();

    // Configurar intervalo
    intervalRef.current = setInterval(async () => {
      // Solo hacer ping si la pestaña esta visible
      if (document.visibilityState === 'visible') {
        ping();
        // Tambien refrescar el token periodicamente para que no expire
        try {
          await supabase.auth.refreshSession();
        } catch {
          // Silenciar - se maneja en auth-context
        }
      }
    }, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [ping, intervalMs]);
}
