'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Loader2, Truck, RefreshCw, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Rutas que no requieren autenticacion
const PUBLIC_ROUTES = ['/login', '/registro'];

// Mensajes de estado de conexion
const CONNECTION_MESSAGES = {
  connecting: 'Conectando con el servidor...',
  reconnecting: 'Reconectando...',
  error: 'Error de conexion',
  idle: 'Verificando sesion...',
  connected: 'Conectado',
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, connectionStatus, connectionError, retryConnection } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loadingTime, setLoadingTime] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  // Contador de tiempo de carga
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isLoading) {
      setLoadingTime(0);
      interval = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Manejar reintento
  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await retryConnection();
    } finally {
      setIsRetrying(false);
    }
  };

  // Recargar pagina
  const handleReload = () => {
    window.location.reload();
  };

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isPublicRoute) {
        router.push('/login');
      } else if (isAuthenticated && isPublicRoute) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, isPublicRoute, router]);

  // Si es ruta publica (login), no bloquear con loading
  if (isLoading && !isPublicRoute) {
    const showRetryButton = loadingTime >= 8 || connectionStatus === 'error';
    const showSlowMessage = loadingTime >= 5 && connectionStatus !== 'error';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="flex flex-col items-center gap-6 p-8 max-w-md text-center">
          {/* Logo */}
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary shadow-lg">
            <Truck className="h-10 w-10 text-primary-foreground" />
          </div>

          {/* Estado de conexion */}
          <div className="flex flex-col items-center gap-3">
            {connectionStatus === 'error' ? (
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <WifiOff className="h-6 w-6 text-red-600" />
              </div>
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            )}

            <div className="space-y-1">
              <p className="text-lg font-medium text-foreground">
                {CONNECTION_MESSAGES[connectionStatus] || 'Cargando...'}
              </p>

              {connectionError && (
                <p className="text-sm text-red-600 flex items-center justify-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {connectionError}
                </p>
              )}

              {showSlowMessage && !connectionError && (
                <p className="text-sm text-muted-foreground">
                  La conexion esta tardando mas de lo normal...
                </p>
              )}

              {loadingTime > 0 && connectionStatus !== 'error' && (
                <p className="text-xs text-muted-foreground">
                  Tiempo: {loadingTime}s
                </p>
              )}
            </div>
          </div>

          {/* Botones de accion */}
          {showRetryButton && (
            <div className="flex flex-col gap-3 w-full">
              <Button
                onClick={handleRetry}
                disabled={isRetrying}
                className="w-full"
                size="lg"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reintentando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reintentar conexion
                  </>
                )}
              </Button>

              <Button
                onClick={handleReload}
                variant="outline"
                className="w-full"
              >
                Recargar pagina
              </Button>

              <p className="text-xs text-muted-foreground mt-2">
                Si el problema persiste, verifica tu conexion a internet o intenta mas tarde.
              </p>
            </div>
          )}
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
          <span>Redirigiendo al login...</span>
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
          <span>Redirigiendo al dashboard...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
