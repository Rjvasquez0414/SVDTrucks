'use client';

import { AuthProvider } from '@/lib/auth-context';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useSupabaseKeepAlive } from '@/hooks/useSupabaseKeepAlive';

// Componente interno que usa el hook de keep-alive
function KeepAliveWrapper({ children }: { children: React.ReactNode }) {
  // Mantiene la conexion con Supabase activa (ping cada 4 minutos)
  useSupabaseKeepAlive();
  return <>{children}</>;
}

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <KeepAliveWrapper>
        <ProtectedRoute>{children}</ProtectedRoute>
      </KeepAliveWrapper>
    </AuthProvider>
  );
}
