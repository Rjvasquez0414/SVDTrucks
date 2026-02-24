'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { RolUsuario } from '@/types/database';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  avatar_url?: string | null;
}

// Estado de conexion para feedback al usuario
export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'error' | 'idle';

interface AuthContextType {
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
  debugLogs: string[];
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (nombre: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configuracion
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000;

// Helper: ejecutar con timeout (para que nunca se cuelgue una Promise)
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`TIMEOUT: ${label} tardo mas de ${ms}ms`));
    }, ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const initializedRef = useRef(false);
  const router = useRouter();

  // Debug logger
  const addDebugLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString('es-CO', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = `[${timestamp}] ${msg}`;
    console.log('[Auth-Debug]', msg);
    setDebugLogs(prev => [...prev.slice(-29), entry]);
  }, []);

  // Obtener perfil del usuario desde la tabla usuarios
  const fetchUserProfile = useCallback(async (authUser: User, attempt = 1): Promise<Usuario | null> => {
    try {
      const query = supabase
        .from('usuarios')
        .select('id, nombre, email, rol, avatar_url')
        .eq('id', authUser.id)
        .single();

      const { data, error } = await withTimeout(
        Promise.resolve(query),
        10000,
        'fetchUserProfile'
      );

      if (error) {
        if (attempt < MAX_RETRIES && (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('TIMEOUT'))) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return fetchUserProfile(authUser, attempt + 1);
        }
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchUserProfile(authUser, attempt + 1);
      }
      console.error('Error fetching user profile:', err);
      return null;
    }
  }, []);

  // ============================================================
  // INICIALIZACION PRINCIPAL - No depender de onAuthStateChange
  // ============================================================
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let mounted = true;

    const initialize = async () => {
      addDebugLog('Inicio: verificando sesion local...');

      // PASO 1: Verificar si hay datos de sesion en localStorage
      // Esto NO hace peticion HTTP, es instantaneo
      let localSession = null;
      try {
        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (storageKey) {
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            addDebugLog(`Sesion local encontrada (expira: ${new Date((parsed.expires_at || 0) * 1000).toLocaleTimeString()})`);
            localSession = parsed;
          } else {
            addDebugLog('No hay sesion en localStorage');
          }
        } else {
          addDebugLog('No hay key de auth en localStorage');
        }
      } catch (e) {
        addDebugLog(`Error leyendo localStorage: ${e instanceof Error ? e.message : String(e)}`);
      }

      // Si no hay sesion local, ir directo a idle (login)
      if (!localSession) {
        addDebugLog('Sin sesion -> idle (mostrar login)');
        if (mounted) {
          setConnectionStatus('idle');
          setIsLoading(false);
        }
        return;
      }

      // PASO 2: Hay sesion local, intentar validarla con el servidor
      // Primero intentar un fetch simple para ver si hay conectividad
      addDebugLog('Verificando conectividad con Supabase...');
      try {
        const pingResult = await withTimeout(
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/vehiculos?select=id&limit=1`, {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${localSession.access_token}`,
            },
          }),
          8000,
          'ping-supabase'
        );
        addDebugLog(`Ping: status ${pingResult.status}`);

        if (pingResult.status === 401) {
          // Token expirado - intentar refresh
          addDebugLog('Token expirado (401), intentando refreshSession...');
          try {
            const { data: { session }, error: refreshErr } = await withTimeout(
              supabase.auth.refreshSession(),
              10000,
              'refreshSession'
            );
            if (refreshErr || !session) {
              addDebugLog(`Refresh fallido: ${refreshErr?.message || 'sin sesion'} -> limpiar y login`);
              // Limpiar sesion corrupta
              await supabase.auth.signOut().catch(() => {});
              if (mounted) {
                setConnectionStatus('idle');
                setIsLoading(false);
              }
              return;
            }
            addDebugLog('Refresh exitoso, cargando perfil...');
            if (session.user && mounted) {
              const profile = await fetchUserProfile(session.user);
              if (profile && mounted) {
                setUsuario(profile);
                setConnectionStatus('connected');
                addDebugLog(`EXITO: ${profile.nombre}`);
              } else if (mounted) {
                setConnectionStatus('idle');
              }
            }
          } catch (refreshCatchErr) {
            addDebugLog(`Refresh error: ${refreshCatchErr instanceof Error ? refreshCatchErr.message : String(refreshCatchErr)}`);
            // Limpiar todo y mandar a login
            await supabase.auth.signOut().catch(() => {});
            if (mounted) {
              setConnectionStatus('idle');
              setIsLoading(false);
            }
            return;
          }
        } else if (pingResult.ok) {
          // Token valido! Cargar perfil directamente desde la tabla usuarios
          // NO usar supabase.auth.getUser() porque se cuelga internamente
          addDebugLog('Token valido, cargando perfil directo (sin getUser)...');
          try {
            // Decodificar el user ID del JWT (payload es la segunda parte en base64)
            const jwtPayload = JSON.parse(atob(localSession.access_token.split('.')[1]));
            const userId = jwtPayload.sub;
            addDebugLog(`User ID del JWT: ${userId?.slice(0, 8)}...`);

            if (userId && mounted) {
              // Query directa a la tabla usuarios con fetch nativo (el SDK de query también podría colgarse)
              const profileResponse = await withTimeout(
                fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/usuarios?select=id,nombre,email,rol,avatar_url&id=eq.${userId}`, {
                  headers: {
                    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                    'Authorization': `Bearer ${localSession.access_token}`,
                    'Accept': 'application/json',
                  },
                }),
                8000,
                'fetch-profile'
              );

              if (profileResponse.ok) {
                const profiles = await profileResponse.json();
                if (profiles.length > 0 && mounted) {
                  const profile = profiles[0] as Usuario;
                  setUsuario(profile);
                  setConnectionStatus('connected');
                  addDebugLog(`EXITO: ${profile.nombre}`);
                } else if (mounted) {
                  addDebugLog('Perfil no encontrado en tabla usuarios');
                  setConnectionStatus('idle');
                }
              } else {
                addDebugLog(`Error cargando perfil: status ${profileResponse.status}`);
                if (mounted) setConnectionStatus('idle');
              }
            } else if (mounted) {
              setConnectionStatus('idle');
            }
          } catch (profileErr) {
            addDebugLog(`Profile error: ${profileErr instanceof Error ? profileErr.message : String(profileErr)}`);
            if (mounted) setConnectionStatus('idle');
          }
        } else {
          addDebugLog(`Ping status inesperado: ${pingResult.status}`);
          if (mounted) {
            setConnectionStatus('error');
            setConnectionError(`Error del servidor (${pingResult.status})`);
          }
        }
      } catch (pingErr) {
        addDebugLog(`Ping fallido: ${pingErr instanceof Error ? pingErr.message : String(pingErr)}`);
        if (mounted) {
          setConnectionStatus('error');
          setConnectionError('No se puede conectar con el servidor. Verifica tu conexion.');
        }
      }

      if (mounted) {
        setIsLoading(false);
      }
    };

    // Ejecutar inicializacion
    initialize();

    // Tambien registrar onAuthStateChange para eventos futuros (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        addDebugLog(`AuthEvent: ${event}`);

        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchUserProfile(session.user);
          if (profile && mounted) {
            setUsuario(profile);
            setConnectionStatus('connected');
          }
          if (mounted) setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUsuario(null);
            setIsLoading(false);
            setConnectionStatus('idle');
          }
        } else if (event === 'TOKEN_REFRESHED') {
          if (mounted) setConnectionStatus('connected');
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refrescar sesion cuando la ventana vuelve a ser visible
  // Usa fetch nativo en vez del SDK de auth (que se cuelga)
  useEffect(() => {
    let isRefreshing = false;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || isRefreshing || !usuario) return;

      isRefreshing = true;

      try {
        // Leer token actual de localStorage
        const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (!storageKey) {
          isRefreshing = false;
          return;
        }
        const stored = localStorage.getItem(storageKey);
        if (!stored) {
          isRefreshing = false;
          return;
        }
        const session = JSON.parse(stored);

        // Verificar si el token sigue siendo valido con un ping
        const pingResult = await withTimeout(
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/vehiculos?select=id&limit=1`, {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${session.access_token}`,
            },
          }),
          8000,
          'visibility-ping'
        );

        if (pingResult.ok) {
          setConnectionStatus('connected');
        } else if (pingResult.status === 401) {
          // Token expirado, intentar refresh via REST
          addDebugLog('Visibility: token expirado, refrescando...');
          try {
            const refreshResp = await withTimeout(
              fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
                method: 'POST',
                headers: {
                  'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh_token: session.refresh_token }),
              }),
              10000,
              'visibility-refresh'
            );

            if (refreshResp.ok) {
              const newSession = await refreshResp.json();
              // Actualizar en localStorage
              localStorage.setItem(storageKey, JSON.stringify(newSession));
              // Tambien actualizar en el SDK
              supabase.auth.setSession({
                access_token: newSession.access_token,
                refresh_token: newSession.refresh_token,
              }).catch(() => {});
              setConnectionStatus('connected');
              addDebugLog('Visibility: token refrescado OK');
            } else {
              addDebugLog('Visibility: refresh fallido, sesion expirada');
              setUsuario(null);
              setConnectionStatus('idle');
            }
          } catch {
            addDebugLog('Visibility: error en refresh');
          }
        }
      } catch {
        // Error silencioso - no deslogear por un glitch de red
      } finally {
        isRefreshing = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [usuario, addDebugLog]);

  // Funcion para reintentar conexion manualmente
  const retryConnection = useCallback(async () => {
    addDebugLog('Reintento manual...');
    setIsLoading(true);
    setConnectionStatus('reconnecting');
    setConnectionError(null);

    try {
      // Limpiar sesion vieja que puede estar corrupta
      addDebugLog('Limpiando sesion vieja...');
      await supabase.auth.signOut().catch(() => {});

      // Esperar un momento para que se limpie
      await new Promise(resolve => setTimeout(resolve, 500));

      setConnectionStatus('idle');
      setIsLoading(false);
      addDebugLog('Sesion limpiada, redirigiendo a login');
    } catch (err) {
      addDebugLog(`Error en reintento: ${err instanceof Error ? err.message : String(err)}`);
      setConnectionStatus('error');
      setConnectionError('No se pudo conectar. Verifica tu conexion a internet.');
      setIsLoading(false);
    }
  }, [addDebugLog]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      addDebugLog(`Login para: ${email}`);

      // Usar fetch nativo a la API de auth de Supabase directamente
      // porque supabase.auth.signInWithPassword() se cuelga
      const authResponse = await withTimeout(
        fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.toLowerCase().trim(),
            password,
          }),
        }),
        15000,
        'login-fetch'
      );

      const authData = await authResponse.json();
      addDebugLog(`Login response: status ${authResponse.status}`);

      if (!authResponse.ok) {
        const errorMsg = authData?.error_description || authData?.msg || authData?.message || 'Error desconocido';
        if (errorMsg.includes('Invalid login credentials')) {
          return { success: false, error: 'Credenciales incorrectas' };
        }
        if (errorMsg.includes('Email not confirmed')) {
          return { success: false, error: 'Email no confirmado' };
        }
        return { success: false, error: errorMsg };
      }

      // Guardar la sesion en el SDK de Supabase manualmente
      if (authData.access_token && authData.refresh_token) {
        addDebugLog('Login exitoso, guardando sesion...');
        // setSession guarda en localStorage y emite SIGNED_IN
        const { error: setError } = await withTimeout(
          supabase.auth.setSession({
            access_token: authData.access_token,
            refresh_token: authData.refresh_token,
          }),
          10000,
          'setSession'
        );

        if (setError) {
          addDebugLog(`setSession error: ${setError.message}, guardando manualmente`);
          // Fallback: guardar directamente en localStorage
          const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
          if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(authData));
          }
        }

        // Cargar perfil directamente via REST
        const userId = authData.user?.id || JSON.parse(atob(authData.access_token.split('.')[1])).sub;
        const profileResponse = await withTimeout(
          fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/usuarios?select=id,nombre,email,rol,avatar_url&id=eq.${userId}`, {
            headers: {
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${authData.access_token}`,
              'Accept': 'application/json',
            },
          }),
          8000,
          'login-profile'
        );

        if (profileResponse.ok) {
          const profiles = await profileResponse.json();
          if (profiles.length > 0) {
            const profile = profiles[0] as Usuario;
            setUsuario(profile);
            setConnectionStatus('connected');
            addDebugLog(`Login exitoso: ${profile.nombre}`);
            return { success: true };
          } else {
            await supabase.auth.signOut().catch(() => {});
            return { success: false, error: 'Usuario no tiene acceso al sistema' };
          }
        } else {
          return { success: false, error: 'Error cargando perfil de usuario' };
        }
      }

      return { success: false, error: 'Respuesta de autenticacion invalida' };
    } catch (error) {
      addDebugLog(`Login error: ${error instanceof Error ? error.message : String(error)}`);
      return { success: false, error: 'Error de conexion' };
    }
  };

  const register = async (nombre: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: { data: { nombre: nombre.trim() } },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          return { success: false, error: 'Este correo ya esta registrado' };
        }
        if (authError.message.includes('Password')) {
          return { success: false, error: 'La contrasena debe tener al menos 6 caracteres' };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Error al crear usuario' };
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const profile = await fetchUserProfile(authData.user);
      if (profile) {
        setUsuario(profile);
      }

      return { success: true };
    } catch (error) {
      console.error('[Auth] Register error:', error);
      return { success: false, error: 'Error de conexion' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUsuario(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isLoading,
        isAuthenticated: !!usuario,
        connectionStatus,
        connectionError,
        debugLogs,
        login,
        register,
        logout,
        retryConnection,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
