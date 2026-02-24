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

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const router = useRouter();

  const addDebugLog = useCallback((msg: string) => {
    const timestamp = new Date().toLocaleTimeString('es-CO', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = `[${timestamp}] ${msg}`;
    console.log('[Auth-Debug]', msg);
    setDebugLogs(prev => [...prev.slice(-29), entry]);
  }, []);

  // Obtener perfil del usuario desde la tabla usuarios
  const fetchUserProfile = useCallback(async (authUser: User, attempt = 1): Promise<Usuario | null> => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, email, rol, avatar_url')
        .eq('id', authUser.id)
        .single();

      if (error) {
        if (attempt < MAX_RETRIES && (error.message.includes('fetch') || error.message.includes('network'))) {
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

  // Reintentar conexion manualmente
  const retryConnection = useCallback(async () => {
    addDebugLog('Reintento manual...');
    setIsLoading(true);
    setConnectionStatus('reconnecting');
    setConnectionError(null);

    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error || !session) {
        // Si no hay sesion valida, mandar a login
        setConnectionStatus('idle');
        setIsLoading(false);
        return;
      }

      const profile = await fetchUserProfile(session.user);
      if (profile) {
        setUsuario(profile);
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('idle');
      }
    } catch (err) {
      addDebugLog(`Error reintento: ${err instanceof Error ? err.message : String(err)}`);
      setConnectionStatus('error');
      setConnectionError('No se pudo conectar. Verifica tu conexion a internet.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile, addDebugLog]);

  // Ref para rastrear si la inicializacion ya completo (evita stale closure en el timeout)
  const initCompletedRef = useRef(false);

  // Listener principal de auth
  useEffect(() => {
    addDebugLog('Configurando onAuthStateChange...');
    let mounted = true;
    initCompletedRef.current = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        addDebugLog(`AuthEvent: ${event} (session: ${session ? 'SI' : 'NO'})`);

        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            addDebugLog(`Sesion encontrada, cargando perfil...`);
            setConnectionStatus('connecting');
            const t0 = Date.now();
            const profile = await fetchUserProfile(session.user);
            addDebugLog(`fetchUserProfile: ${Date.now() - t0}ms, result: ${profile ? profile.nombre : 'NULL'}`);
            if (mounted) {
              if (profile) {
                setUsuario(profile);
                setConnectionStatus('connected');
              } else {
                setConnectionStatus('error');
                setConnectionError('No se encontro el perfil de usuario');
              }
            }
          } else {
            addDebugLog('Sin sesion -> login');
            if (mounted) setConnectionStatus('idle');
          }
          if (mounted) {
            initCompletedRef.current = true;
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          addDebugLog('SIGNED_IN');
          const profile = await fetchUserProfile(session.user);
          if (mounted && profile) {
            setUsuario(profile);
            setConnectionStatus('connected');
          }
          if (mounted) {
            initCompletedRef.current = true;
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          addDebugLog('SIGNED_OUT');
          if (mounted) {
            setUsuario(null);
            setIsLoading(false);
            setConnectionStatus('idle');
            initCompletedRef.current = true;
          }
        } else if (event === 'TOKEN_REFRESHED') {
          addDebugLog('TOKEN_REFRESHED');
          if (mounted) setConnectionStatus('connected');
        }
      }
    );

    addDebugLog('onAuthStateChange registrado');

    // Timeout de seguridad (15s) - usa ref para evitar stale closure
    const timeoutId = setTimeout(() => {
      if (mounted && !initCompletedRef.current) {
        addDebugLog('TIMEOUT 15s - forzando resolucion');
        setConnectionStatus('error');
        setConnectionError('La conexion tardo demasiado. Intenta recargar.');
        setIsLoading(false);
      }
    }, 15000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No necesitamos handleVisibilityChange para auth:
  // - autoRefreshToken: true ya renueva el token automaticamente
  // - onAuthStateChange escucha TOKEN_REFRESHED y SIGNED_OUT
  // - El handler anterior llamaba getUser() al volver a la pestaña,
  //   lo cual podia colgar 15-30s por conexion TCP muerta y luego
  //   borrar el usuario causando un redirect loop a /login

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      addDebugLog(`Login: ${email}`);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      addDebugLog(`signIn result: ${error ? 'ERROR ' + error.message : 'OK'}`);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Credenciales incorrectas' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Email no confirmado' };
        }
        return { success: false, error: error.message };
      }

      if (!data.user) {
        return { success: false, error: 'Error al iniciar sesion' };
      }

      const profile = await fetchUserProfile(data.user);

      if (!profile) {
        await supabase.auth.signOut();
        return { success: false, error: 'Usuario no tiene acceso al sistema' };
      }

      setUsuario(profile);
      setConnectionStatus('connected');
      addDebugLog(`Login exitoso: ${profile.nombre}`);
      return { success: true };
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
