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

// --- SOLUCION AL CUELGUE AL CAMBIAR DE PESTAÑA ---
//
// CAUSA RAIZ: El SDK de Supabase Auth tiene un handler de visibilitychange que:
//   1. Adquiere un lock con timeout INFINITO (-1)
//   2. Llama _recoverAndRefresh() que hace un fetch de red
//   3. Si la conexion TCP esta muerta (comun despues de cambiar de pestaña),
//      el fetch se cuelga y el lock NUNCA se libera
//   4. Todas las operaciones de auth (getSession, getUser, etc.) se encolan
//      esperando el lock -> DEADLOCK
//
// SOLUCION (3 partes):
//   1. noopLock: evita deadlock de navigator.locks (que tambien se cuelga)
//   2. fetchWithRetry: timeout de 5s + reintento para manejar conexiones muertas
//   3. Desactivar el visibilitychange handler del SDK y reemplazarlo con
//      startAutoRefresh/stopAutoRefresh que son NON-BLOCKING (usan timeout=0)

const noopLock = async <R>(
  _name: string,
  _acquireTimeout: number,
  fn: () => Promise<R>
): Promise<R> => {
  return fn();
};

// Fetch con timeout y reintento para manejar conexiones TCP muertas
const FETCH_TIMEOUT_MS = 5_000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 500;

function singleFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();

  const callerSignal = init?.signal;
  if (callerSignal) {
    if (callerSignal.aborted) {
      controller.abort(callerSignal.reason);
    } else {
      callerSignal.addEventListener('abort', () => controller.abort(callerSignal.reason), { once: true });
    }
  }

  const timeoutId = setTimeout(() => controller.abort(new Error('Timeout')), FETCH_TIMEOUT_MS);

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeoutId);
  });
}

const fetchWithRetry: typeof fetch = async (input, init) => {
  const callerSignal = init?.signal;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (callerSignal?.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }

    try {
      return await singleFetch(input, init);
    } catch (err) {
      if (callerSignal?.aborted) throw err;
      if (attempt >= MAX_RETRIES) throw err;

      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  throw new Error('Unreachable');
};

export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      lock: noopLock,
    },
    global: {
      headers: {
        'x-my-custom-header': 'svd-trucks',
      },
      fetch: fetchWithRetry,
    },
  }
);

// --- PARTE 3: Desactivar el visibilitychange handler del SDK ---
// El SDK registra un listener que llama _recoverAndRefresh() con lock
// de timeout infinito. Lo reemplazamos con startAutoRefresh/stopAutoRefresh
// que usan _acquireLock(0, ...) - si el lock esta ocupado, se saltan sin bloquear.
if (typeof window !== 'undefined') {
  // Esperar a que el SDK termine de inicializarse (siguiente tick)
  setTimeout(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authClient = supabase.auth as any;

    // Remover el handler del SDK que causa el deadlock
    if (authClient.visibilityChangedCallback) {
      window.removeEventListener('visibilitychange', authClient.visibilityChangedCallback);
      authClient.visibilityChangedCallback = null;
    }

    // Nuestro handler: solo maneja start/stop del auto-refresh ticker (non-blocking)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
  }, 0);
}

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
