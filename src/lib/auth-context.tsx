'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

// Configuracion de reintentos
const MAX_RETRIES = 3;
const INITIAL_TIMEOUT = 10000; // 10 segundos (Supabase free puede tardar en despertar)
const RETRY_DELAY = 2000; // 2 segundos entre reintentos

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const router = useRouter();

  // Debug logger que guarda logs en estado para mostrar en pantalla
  const addDebugLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString('es-CO', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = `[${timestamp}] ${msg}`;
    console.log('[Auth-Debug]', msg);
    setDebugLogs(prev => [...prev.slice(-19), entry]); // Mantener ultimos 20 logs
  }, []);

  // Obtener perfil del usuario desde la tabla usuarios con retry
  const fetchUserProfile = useCallback(async (authUser: User, attempt = 1): Promise<Usuario | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol, avatar_url')
        .eq('id', authUser.id)
        .single();

      if (error) {
        // Si es error de conexion y tenemos reintentos disponibles
        if (attempt < MAX_RETRIES && (error.message.includes('fetch') || error.message.includes('network'))) {
          console.log(`[Auth] Reintentando fetchUserProfile (${attempt}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return fetchUserProfile(authUser, attempt + 1);
        }
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.log(`[Auth] Error de red, reintentando (${attempt}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchUserProfile(authUser, attempt + 1);
      }
      console.error('Error fetching user profile:', err);
      return null;
    }
  }, []);

  // Funcion para verificar conexion con Supabase
  const checkSupabaseConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Hacer una consulta simple para verificar que Supabase responde
      const { error } = await supabase.from('vehiculos').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  }, []);

  // Funcion para reintentar conexion manualmente
  const retryConnection = useCallback(async () => {
    console.log('[Auth] Reintentando conexion manualmente...');
    setIsLoading(true);
    setConnectionStatus('reconnecting');
    setConnectionError(null);
    setRetryCount(0);

    try {
      // Primero verificar que Supabase responde
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        throw new Error('No se puede conectar con el servidor');
      }

      // Forzar refresh de la sesion contra el servidor (NO usar getSession que usa cache)
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        // Si el refresh falla, intentar getUser como fallback
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profile = await fetchUserProfile(user);
          if (profile) {
            setUsuario(profile);
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('idle');
          }
        } else {
          setConnectionStatus('idle');
        }
        return;
      }

      if (session?.user) {
        const profile = await fetchUserProfile(session.user);
        if (profile) {
          setUsuario(profile);
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('idle');
        }
      } else {
        setConnectionStatus('idle');
      }
    } catch (err) {
      console.error('[Auth] Error en reintento:', err);
      setConnectionStatus('error');
      setConnectionError('No se pudo conectar. Verifica tu conexion a internet.');
    } finally {
      setIsLoading(false);
    }
  }, [checkSupabaseConnection, fetchUserProfile]);

  // Escuchar cambios de autenticacion con mejor manejo de errores
  useEffect(() => {
    addDebugLog('Configurando listener de auth...');
    let initialCheckDone = false;
    let mounted = true;
    let retryTimeout: NodeJS.Timeout | null = null;

    const handleAuthEvent = async (event: string, session: { user: User } | null) => {
      if (!mounted) return;

      addDebugLog(`onAuthStateChange: ${event} (session: ${session ? 'SI' : 'NO'})`);

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          addDebugLog(`Sesion inicial encontrada (uid: ${session.user.id.slice(0, 8)}...), cargando perfil...`);
          setConnectionStatus('connecting');
          try {
            const t0 = Date.now();
            const profile = await fetchUserProfile(session.user);
            addDebugLog(`fetchUserProfile tardo ${Date.now() - t0}ms, resultado: ${profile ? profile.nombre : 'NULL'}`);
            if (mounted) {
              if (profile) {
                setUsuario(profile);
                setConnectionStatus('connected');
                addDebugLog('EXITO: Usuario cargado, isLoading -> false');
              } else {
                setConnectionStatus('error');
                setConnectionError('No se encontro el perfil de usuario');
                addDebugLog('ERROR: Perfil no encontrado en tabla usuarios');
              }
            }
          } catch (err) {
            addDebugLog(`ERROR cargando perfil: ${err instanceof Error ? err.message : String(err)}`);
            if (mounted) {
              setConnectionStatus('error');
              setConnectionError('Error al cargar el perfil');
            }
          }
        } else {
          addDebugLog('No hay sesion inicial -> redirigir a login');
          if (mounted) setConnectionStatus('idle');
        }
        initialCheckDone = true;
        if (mounted) setIsLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        addDebugLog('SIGNED_IN recibido');
        initialCheckDone = true;
        setConnectionStatus('connecting');
        try {
          const profile = await fetchUserProfile(session.user);
          if (mounted && profile) {
            setUsuario(profile);
            setConnectionStatus('connected');
          }
        } catch (err) {
          addDebugLog(`ERROR en SIGNED_IN: ${err instanceof Error ? err.message : String(err)}`);
        }
        if (mounted) setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        addDebugLog('SIGNED_OUT recibido');
        if (mounted) {
          setUsuario(null);
          setIsLoading(false);
          setConnectionStatus('idle');
        }
        initialCheckDone = true;
      } else if (event === 'TOKEN_REFRESHED') {
        addDebugLog('TOKEN_REFRESHED recibido');
        if (mounted) setConnectionStatus('connected');
      }
    };

    // Usar onAuthStateChange como fuente principal
    addDebugLog('Registrando onAuthStateChange...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await handleAuthEvent(event, session);
      }
    );
    addDebugLog('onAuthStateChange registrado, esperando INITIAL_SESSION...');

    // Timeout de seguridad (10s) - si onAuthStateChange no respondio, intentar directamente
    const timeoutId = setTimeout(async () => {
      if (!initialCheckDone && mounted) {
        addDebugLog('TIMEOUT 10s! onAuthStateChange nunca respondio. Intentando getUser()...');
        setConnectionStatus('reconnecting');

        try {
          const t0 = Date.now();
          const { data: { user }, error } = await supabase.auth.getUser();
          addDebugLog(`getUser() tardo ${Date.now() - t0}ms, user: ${user ? 'SI' : 'NO'}, error: ${error?.message || 'ninguno'}`);

          if (mounted) {
            if (!error && user) {
              const profile = await fetchUserProfile(user);
              if (profile && mounted) {
                setUsuario(profile);
                setConnectionStatus('connected');
                addDebugLog('EXITO via timeout fallback');
              }
            } else {
              setConnectionStatus('idle');
              addDebugLog('No hay usuario valido, idle');
            }
            initialCheckDone = true;
            setIsLoading(false);
          }
        } catch (err) {
          addDebugLog(`ERROR en timeout: ${err instanceof Error ? err.message : String(err)}`);
          if (mounted) {
            setConnectionStatus('error');
            setConnectionError('No se pudo conectar. Intenta recargar la pagina.');
            setIsLoading(false);
            initialCheckDone = true;
          }
        }
      }
    }, INITIAL_TIMEOUT);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      if (retryTimeout) clearTimeout(retryTimeout);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUserProfile, addDebugLog]); // Removido retryCount para evitar re-montar el listener

  // Refrescar sesion cuando la ventana vuelve a ser visible
  // CRITICO: Usar getUser() que valida contra el servidor, NO getSession() que usa cache local
  useEffect(() => {
    let isRefreshing = false;

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible' || isRefreshing) return;

      isRefreshing = true;
      console.log('[Auth] Ventana visible - refrescando sesion con servidor...');

      try {
        // PASO 1: Forzar refresh del token contra el servidor de Supabase
        // getUser() valida el token con el servidor (NO usa cache local como getSession)
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          // El token no es valido - intentar refrescar
          console.log('[Auth] Token invalido, intentando refreshSession...');
          const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

          if (refreshError || !session) {
            if (usuario) {
              console.log('[Auth] Sesion expirada - limpiando estado local');
              setUsuario(null);
              setConnectionStatus('idle');
            }
            isRefreshing = false;
            return;
          }

          // Refresh exitoso, el usuario ahora es valido
          if (session.user) {
            const profile = await fetchUserProfile(session.user);
            if (profile) {
              setUsuario(profile);
              setConnectionStatus('connected');
            }
          }
        } else {
          // Token valido - solo actualizar estado de conexion
          setConnectionStatus('connected');
        }
      } catch (err) {
        console.error('[Auth] Error refrescando sesion:', err);
        // No marcar error inmediatamente - puede ser un glitch de red momentaneo
        // Los datos ya cargados siguen visibles
      } finally {
        isRefreshing = false;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [usuario, fetchUserProfile]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Auth] Iniciando login para:', email);
      const startTime = Date.now();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      console.log('[Auth] signInWithPassword completado en', Date.now() - startTime, 'ms');

      if (error) {
        console.log('[Auth] Error de Supabase:', error.message);
        // Traducir errores comunes
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Credenciales incorrectas' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Email no confirmado' };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        console.log('[Auth] No se recibio usuario');
        return { success: false, error: 'Error al iniciar sesion' };
      }

      console.log('[Auth] Usuario autenticado, obteniendo perfil...');
      const profileStart = Date.now();

      // Obtener perfil
      const profile = await fetchUserProfile(data.user);

      console.log('[Auth] fetchUserProfile completado en', Date.now() - profileStart, 'ms');

      if (!profile) {
        console.log('[Auth] No se encontro perfil en tabla usuarios');
        // Usuario existe en auth pero no tiene perfil en la tabla usuarios
        await supabase.auth.signOut();
        return { success: false, error: 'Usuario no tiene acceso al sistema' };
      }

      console.log('[Auth] Login exitoso, perfil:', profile.nombre);
      setUsuario(profile);
      return { success: true };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { success: false, error: 'Error de conexion' };
    }
  };

  const register = async (nombre: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Auth] Iniciando registro para:', email);

      // 1. Crear usuario en Supabase Auth (el trigger creara el perfil automaticamente)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            nombre: nombre.trim(),
          },
        },
      });

      if (authError) {
        console.error('[Auth] Error en signUp:', authError.message);
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

      console.log('[Auth] Usuario creado, el trigger creara el perfil automaticamente');

      // Esperar un momento para que el trigger cree el perfil
      await new Promise(resolve => setTimeout(resolve, 500));

      // Obtener el perfil creado por el trigger
      const profile = await fetchUserProfile(authData.user);
      if (profile) {
        setUsuario(profile);
        console.log('[Auth] Registro exitoso para:', profile.nombre);
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
