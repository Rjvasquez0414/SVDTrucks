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
  const router = useRouter();

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

      // Intentar obtener sesion existente
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
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
    console.log('[Auth] Configurando listener de auth...');
    let initialCheckDone = false;
    let mounted = true;
    let retryTimeout: NodeJS.Timeout | null = null;

    const handleAuthEvent = async (event: string, session: { user: User } | null) => {
      if (!mounted) return;

      console.log('[Auth] onAuthStateChange evento:', event);

      if (event === 'INITIAL_SESSION') {
        if (session?.user) {
          console.log('[Auth] Sesion inicial encontrada, cargando perfil...');
          setConnectionStatus('connecting');
          try {
            const profile = await fetchUserProfile(session.user);
            if (mounted) {
              if (profile) {
                setUsuario(profile);
                setConnectionStatus('connected');
              } else {
                setConnectionStatus('error');
                setConnectionError('No se encontro el perfil de usuario');
              }
            }
          } catch (err) {
            console.error('[Auth] Error cargando perfil:', err);
            if (mounted) {
              setConnectionStatus('error');
              setConnectionError('Error al cargar el perfil');
            }
          }
        } else {
          console.log('[Auth] No hay sesion inicial');
          if (mounted) setConnectionStatus('idle');
        }
        initialCheckDone = true;
        if (mounted) setIsLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        console.log('[Auth] Usuario inicio sesion');
        initialCheckDone = true;
        setConnectionStatus('connecting');
        try {
          const profile = await fetchUserProfile(session.user);
          if (mounted && profile) {
            setUsuario(profile);
            setConnectionStatus('connected');
          }
        } catch (err) {
          console.error('[Auth] Error cargando perfil:', err);
        }
        if (mounted) setIsLoading(false);
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] Usuario cerro sesion');
        if (mounted) {
          setUsuario(null);
          setIsLoading(false);
          setConnectionStatus('idle');
        }
        initialCheckDone = true;
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('[Auth] Token refrescado - sesion activa');
        if (mounted) setConnectionStatus('connected');
      }
    };

    // Usar onAuthStateChange como fuente principal
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await handleAuthEvent(event, session);
      }
    );

    // Timeout de seguridad mas largo (10s) con logica de reintento
    const timeoutId = setTimeout(async () => {
      if (!initialCheckDone && mounted) {
        console.warn('[Auth] TIMEOUT inicial - intentando reconexion...');
        setConnectionStatus('reconnecting');
        setRetryCount(prev => prev + 1);

        // Intentar obtener sesion directamente
        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            throw error;
          }

          if (mounted) {
            if (session?.user) {
              const profile = await fetchUserProfile(session.user);
              if (profile) {
                setUsuario(profile);
                setConnectionStatus('connected');
              }
            } else {
              setConnectionStatus('idle');
            }
            initialCheckDone = true;
            setIsLoading(false);
          }
        } catch (err) {
          console.error('[Auth] Error en timeout retry:', err);
          if (mounted) {
            // Si falla, programar otro reintento
            if (retryCount < MAX_RETRIES) {
              retryTimeout = setTimeout(async () => {
                if (mounted && !initialCheckDone) {
                  console.log(`[Auth] Reintento ${retryCount + 1}/${MAX_RETRIES}...`);
                  setRetryCount(prev => prev + 1);

                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session?.user) {
                      const profile = await fetchUserProfile(session.user);
                      if (profile && mounted) {
                        setUsuario(profile);
                        setConnectionStatus('connected');
                      }
                    } else if (mounted) {
                      setConnectionStatus('idle');
                    }
                  } catch {
                    if (mounted) {
                      setConnectionStatus('error');
                      setConnectionError('No se pudo establecer conexion. Intenta recargar la pagina.');
                    }
                  }
                  if (mounted) {
                    initialCheckDone = true;
                    setIsLoading(false);
                  }
                }
              }, RETRY_DELAY);
            } else {
              setConnectionStatus('error');
              setConnectionError('No se pudo conectar despues de varios intentos.');
              setIsLoading(false);
              initialCheckDone = true;
            }
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
  }, [fetchUserProfile]); // Removido retryCount para evitar re-montar el listener

  // Refrescar sesion cuando la ventana vuelve a ser visible
  // IMPORTANTE: Siempre verificar, no solo cuando no hay usuario
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[Auth] Ventana visible - verificando sesion...');
        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.error('[Auth] Error obteniendo sesion:', error);
            setConnectionStatus('error');
            return;
          }

          if (session?.user) {
            // Verificar que el usuario aun existe y actualizar conexion
            const profile = await fetchUserProfile(session.user);
            if (profile) {
              setUsuario(profile);
              setConnectionStatus('connected');
            }
          } else if (usuario) {
            // Habia usuario pero ya no hay sesion - cerrar sesion local
            console.log('[Auth] Sesion expirada - limpiando estado local');
            setUsuario(null);
            setConnectionStatus('idle');
          }
        } catch (err) {
          console.error('[Auth] Error verificando sesion:', err);
          setConnectionStatus('error');
        }
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
