'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (nombre.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return;
    }

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden');
      return;
    }

    setIsLoading(true);

    const result = await register(nombre, email, password);

    if (result.success) {
      setSuccess(true);
      // Redirigir al dashboard despues de 2 segundos
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } else {
      setError(result.error || 'Error al registrar usuario');
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

        {/* Card de registro */}
        <Card className="shadow-2xl border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center text-white">Crear Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="font-medium text-lg mb-2 text-white">Registro exitoso</h3>
                <p className="text-sm text-white/50">
                  Redirigiendo al sistema...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="nombre" className="text-white/70">Nombre Completo</Label>
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Juan Perez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="name"
                    className="bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-azutrans-yellow focus-visible:ring-azutrans-yellow/30"
                  />
                </div>

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
                      placeholder="Minimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="new-password"
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/70">Confirmar Contrasena</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repite tu contrasena"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="bg-white/10 border-white/15 text-white placeholder:text-white/30 focus:border-azutrans-yellow focus-visible:ring-azutrans-yellow/30"
                  />
                </div>

                {/* Submit button */}
                <Button type="submit" className="w-full bg-azutrans-yellow text-azutrans-black hover:bg-azutrans-yellow/90 font-semibold" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>

                {/* Link a login */}
                <p className="text-center text-sm text-white/40">
                  Ya tienes cuenta?{' '}
                  <Link href="/login" className="text-azutrans-yellow hover:underline font-medium">
                    Inicia sesion
                  </Link>
                </p>
              </form>
            )}
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
