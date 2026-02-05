import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
  });
}

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-my-custom-header': 'svd-trucks',
      },
    },
    // Configuracion de realtime para mejor manejo de conexion
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  }
);

// Cliente para uso en servidor (Server Components, API Routes)
export function createServerClient() {
  return createClient<Database>(supabaseUrl || '', supabaseAnonKey || '', {
    auth: {
      persistSession: false,
    },
  });
}

// Utilidad para verificar conexion con Supabase
export async function checkConnection(): Promise<{ connected: boolean; latency?: number; error?: string }> {
  const startTime = Date.now();

  try {
    const { error } = await supabase.from('vehiculos').select('id').limit(1);

    if (error) {
      return { connected: false, error: error.message };
    }

    const latency = Date.now() - startTime;
    return { connected: true, latency };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Error de conexion desconocido',
    };
  }
}

// Utilidad para ejecutar query con reintentos
export async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: { message: string } | null }>,
  maxRetries = 3,
  delayMs = 1000
): Promise<{ data: T | null; error: string | null }> {
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data, error } = await queryFn();

      if (!error) {
        return { data, error: null };
      }

      lastError = error.message;

      // Si es el ultimo intento, no esperar
      if (attempt < maxRetries) {
        console.log(`[Supabase] Query fallida, reintentando (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Error desconocido';

      if (attempt < maxRetries) {
        console.log(`[Supabase] Error de red, reintentando (${attempt}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  return { data: null, error: lastError };
}
