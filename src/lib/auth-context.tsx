'use client';

// ============================================
// MODO MOCK - Auth sin Supabase
// ============================================

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
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
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (nombre: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  retryConnection: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Usuario mock para pruebas
const MOCK_USER: Usuario = {
  id: 'mock-user-1',
  nombre: 'Administrador (Mock)',
  email: 'admin@svdtrucks.com',
  rol: 'administrador',
  avatar_url: null,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [connectionError] = useState<string | null>(null);
  const router = useRouter();

  // Simular carga inicial - auto-login instantáneo
  useEffect(() => {
    console.log('[MOCK AUTH] Iniciando sesión automática...');

    // Pequeño delay para simular carga
    const timer = setTimeout(() => {
      setUsuario(MOCK_USER);
      setConnectionStatus('connected');
      setIsLoading(false);
      console.log('[MOCK AUTH] Usuario autenticado:', MOCK_USER.nombre);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[MOCK AUTH] Login:', email, password);
    setUsuario(MOCK_USER);
    setConnectionStatus('connected');
    return { success: true };
  };

  const register = async (nombre: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[MOCK AUTH] Register:', nombre, email, password);
    setUsuario({ ...MOCK_USER, nombre, email });
    setConnectionStatus('connected');
    return { success: true };
  };

  const logout = async () => {
    console.log('[MOCK AUTH] Logout');
    setUsuario(null);
    setConnectionStatus('idle');
    router.push('/login');
  };

  const retryConnection = async () => {
    console.log('[MOCK AUTH] Retry connection');
    setIsLoading(true);
    setConnectionStatus('reconnecting');

    setTimeout(() => {
      setUsuario(MOCK_USER);
      setConnectionStatus('connected');
      setIsLoading(false);
    }, 500);
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
