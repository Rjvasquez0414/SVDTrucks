'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Error al iniciar sesion');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-azutrans-black p-4">
      <div className="w-full max-w-md">
        {/* Logo y titulo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-azutrans-yellow mb-4 shadow-lg shadow-azutrans-yellow/20">
            <Truck className="h-8 w-8 text-azutrans-black" />
          </div>
          <h1 className="text-2xl font-bold text-azutrans-yellow tracking-wide">AZUTRANS</h1>
          <p className="text-white/50 mt-1 text-xs tracking-widest uppercase">EAM DIONE - Gestion de Flotas</p>
        </div>

        {/* Card de login */}
        <Card className="shadow-2xl border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-white">Iniciar Sesion</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70">Correo Electronico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-azutrans-yellow focus-visible:ring-azutrans-yellow/30"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70">Contrasena</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="pr-10 bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-azutrans-yellow focus-visible:ring-azutrans-yellow/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <Button type="submit" className="w-full bg-azutrans-yellow text-azutrans-black hover:bg-azutrans-yellow/90 font-semibold" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </Button>

              {/* Link a registro */}
              <p className="text-center text-sm text-white/40">
                No tienes cuenta?{' '}
                <Link href="/registro" className="text-azutrans-yellow hover:underline font-medium">
                  Registrate aqui
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-white/30 mt-6">
          AZUTRANS - EAM DIONE - Sistema de Gestion de Flotas
        </p>
      </div>
    </div>
  );
}
