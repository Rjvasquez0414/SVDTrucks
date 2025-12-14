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

interface AuthContextType {
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Flag para evitar llamadas concurrentes
  const loadingProfileRef = useRef(false);

  // Obtener perfil del usuario desde la tabla usuarios
  const fetchUserProfile = useCallback(async (authUser: User): Promise<Usuario | null> => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, email, rol, avatar_url')
      .eq('id', authUser.id)
      .single();

    if (error || !data) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }, []);

  // Escuchar cambios de autenticacion
  useEffect(() => {
    console.log('[Auth] Configurando listener de auth...');
    let initialCheckDone = false;

    // Funcion para cargar perfil evitando llamadas concurrentes
    const loadProfileSafely = async (user: User): Promise<Usuario | null> => {
      // Si ya hay una carga en progreso, no hacer otra
      if (loadingProfileRef.current) {
        console.log('[Auth] Ya hay una carga de perfil en progreso, omitiendo...');
        return null;
      }

      loadingProfileRef.current = true;
      try {
        // Usar fetchUserProfile directo (sin timeout agresivo)
        const profile = await fetchUserProfile(user);
        return profile;
      } finally {
        loadingProfileRef.current = false;
      }
    };

    // Usar onAuthStateChange como fuente principal
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] onAuthStateChange evento:', event, '| initialCheckDone:', initialCheckDone);

        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            console.log('[Auth] Sesion inicial encontrada, cargando perfil...');
            const profile = await loadProfileSafely(session.user);
            console.log('[Auth] Perfil cargado:', profile?.nombre || 'null');
            if (profile) {
              setUsuario(profile);
            }
          } else {
            console.log('[Auth] No hay sesion inicial');
          }
          initialCheckDone = true;
          setIsLoading(false);
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('[Auth] Usuario inicio sesion');
          const wasInitialCheck = !initialCheckDone;
          if (wasInitialCheck) {
            console.log('[Auth] SIGNED_IN como evento inicial');
            initialCheckDone = true;
          }
          // Solo cargar perfil si NO hay usuario actualmente
          if (!usuario) {
            const profile = await loadProfileSafely(session.user);
            console.log('[Auth] Perfil cargado:', profile?.nombre || 'null');
            if (profile) {
              setUsuario(profile);
            }
          } else {
            console.log('[Auth] Usuario ya existe, omitiendo carga de perfil');
          }
          if (wasInitialCheck) {
            console.log('[Auth] Completando carga inicial');
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth] Usuario cerro sesion');
          setUsuario(null);
          if (!initialCheckDone) {
            initialCheckDone = true;
            setIsLoading(false);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refrescado - sesion activa');
          // No hacer nada, el token se refrescó automáticamente
        }
      }
    );

    // Timeout de seguridad - si ningun evento llega en 3s
    const timeoutId = setTimeout(() => {
      if (!initialCheckDone) {
        console.warn('[Auth] TIMEOUT - no se recibio evento de auth en 3s');
        initialCheckDone = true;
        setIsLoading(false);
      }
    }, 3000);

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile, usuario]);

  // Refrescar sesion cuando la ventana vuelve a ser visible
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        // Si ya hay usuario, no hacer nada - la sesion está activa
        if (usuario) {
          console.log('[Auth] Ventana visible - usuario activo, sin accion necesaria');
          return;
        }

        // Solo verificar sesion si no hay usuario
        console.log('[Auth] Ventana visible, sin usuario - verificando sesion...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && !loadingProfileRef.current) {
          console.log('[Auth] Sesion encontrada, restaurando perfil...');
          loadingProfileRef.current = true;
          try {
            const profile = await fetchUserProfile(session.user);
            if (profile) {
              setUsuario(profile);
            }
          } finally {
            loadingProfileRef.current = false;
          }
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
        login,
        logout,
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
