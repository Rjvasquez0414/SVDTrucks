'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Truck } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Rutas que no requieren autenticacion
const PUBLIC_ROUTES = ['/login'];

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

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

  // Mostrar loading mientras se verifica la autenticacion
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary animate-pulse">
            <Truck className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  // Redirigiendo si no tiene permisos
  if (!isAuthenticated && !isPublicRoute) {
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
