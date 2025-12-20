'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Truck } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Rutas que no requieren autenticacion
const PUBLIC_ROUTES = ['/login', '/registro'];

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loadingMessage, setLoadingMessage] = useState('Conectando...');

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Cambiar mensaje de loading despues de unos segundos
  useEffect(() => {
    if (isLoading) {
      const timer1 = setTimeout(() => {
        setLoadingMessage('Estableciendo conexion...');
      }, 3000);
      const timer2 = setTimeout(() => {
        setLoadingMessage('Esto esta tardando mas de lo normal...');
      }, 7000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        // Usuario no autenticado intentando acceder a ruta protegida
        router.push('/login');
      } else if (isAuthenticated && isPublicRoute) {
        // Usuario autenticado intentando acceder a login
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, isPublicRoute, router]);

  // Si es ruta publica (login), no bloquear con loading
  // Solo mostrar loading en rutas protegidas
  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary animate-pulse">
            <Truck className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{loadingMessage}</span>
          </div>
        </div>
      </div>
    );
  }

  // Redirigiendo si no tiene permisos
  if (!isAuthenticated && !isPublicRoute && !isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Redirigiendo...</span>
        </div>
      </div>
    );
  }

  // Usuario autenticado en ruta publica (login) - redirigir
  if (isAuthenticated && isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Redirigiendo...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
