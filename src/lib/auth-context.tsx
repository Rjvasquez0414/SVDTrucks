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

interface AuthContextType {
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (nombre: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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

  // Escuchar cambios de autenticacion - SOLO SE EJECUTA UNA VEZ
  useEffect(() => {
    console.log('[Auth] Configurando listener de auth...');
    let initialCheckDone = false;
    let mounted = true;

    // Usar onAuthStateChange como fuente principal
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[Auth] onAuthStateChange evento:', event);

        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            console.log('[Auth] Sesion inicial encontrada, cargando perfil...');
            try {
              const profile = await fetchUserProfile(session.user);
              if (mounted && profile) {
                setUsuario(profile);
              }
            } catch (err) {
              console.error('[Auth] Error cargando perfil:', err);
            }
          } else {
            console.log('[Auth] No hay sesion inicial');
          }
          initialCheckDone = true;
          if (mounted) setIsLoading(false);
        } else if (event === 'SIGNED_IN' && session?.user) {
          console.log('[Auth] Usuario inicio sesion');
          if (!initialCheckDone) {
            initialCheckDone = true;
          }
          try {
            const profile = await fetchUserProfile(session.user);
            if (mounted && profile) {
              setUsuario(profile);
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
          }
          initialCheckDone = true;
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth] Token refrescado - sesion activa');
        }
      }
    );

    // Timeout de seguridad - si ningun evento llega en 2s
    const timeoutId = setTimeout(() => {
      if (!initialCheckDone && mounted) {
        console.warn('[Auth] TIMEOUT - forzando fin de carga');
        setIsLoading(false);
      }
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // REMOVIDO 'usuario' del dependency array

  // Refrescar sesion cuando la ventana vuelve a ser visible (solo si no hay usuario)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !usuario) {
        console.log('[Auth] Ventana visible sin usuario - verificando sesion...');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await fetchUserProfile(session.user);
            if (profile) {
              setUsuario(profile);
            }
          }
        } catch (err) {
          console.error('[Auth] Error verificando sesion:', err);
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

      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
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

      console.log('[Auth] Usuario creado en Auth, creando perfil...');

      // 2. Crear perfil en tabla usuarios
      const { error: profileError } = await (supabase as any)
        .from('usuarios')
        .insert({
          id: authData.user.id,
          nombre: nombre.trim(),
          email: email.toLowerCase().trim(),
          rol: 'operador', // Por defecto, nuevos usuarios son operadores
          activo: true,
        });

      if (profileError) {
        console.error('[Auth] Error creando perfil:', profileError);
        // Si falla crear el perfil, eliminar el usuario de auth
        await supabase.auth.admin?.deleteUser(authData.user.id);
        return { success: false, error: 'Error al crear perfil de usuario' };
      }

      console.log('[Auth] Registro exitoso para:', nombre);

      // 3. Obtener el perfil creado
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
        login,
        register,
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
