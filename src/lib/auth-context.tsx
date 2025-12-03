'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'administrador' | 'operador';
  avatar?: string;
}

// Usuarios de prueba para el prototipo
const USUARIOS_DEMO: Record<string, { password: string; usuario: Usuario }> = {
  'admin@svdtrucks.com': {
    password: 'admin123',
    usuario: {
      id: 'u001',
      nombre: 'Administrador',
      email: 'admin@svdtrucks.com',
      rol: 'administrador',
    },
  },
  'demo@svdtrucks.com': {
    password: 'demo123',
    usuario: {
      id: 'u002',
      nombre: 'Usuario Demo',
      email: 'demo@svdtrucks.com',
      rol: 'operador',
    },
  },
};

interface AuthContextType {
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'svd_trucks_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Cargar sesion desde localStorage al iniciar
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUsuario(parsed);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simular delay de red
    await new Promise((resolve) => setTimeout(resolve, 800));

    const emailLower = email.toLowerCase().trim();
    const userRecord = USUARIOS_DEMO[emailLower];

    if (!userRecord) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    if (userRecord.password !== password) {
      return { success: false, error: 'Contrasena incorrecta' };
    }

    // Login exitoso
    setUsuario(userRecord.usuario);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userRecord.usuario));

    return { success: true };
  };

  const logout = () => {
    setUsuario(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
