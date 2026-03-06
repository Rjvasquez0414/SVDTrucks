'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function PerfilPage() {
  const { usuario } = useAuth();

  const [nombre, setNombre] = useState(usuario?.nombre || '');
  const [savingNombre, setSavingNombre] = useState(false);
  const [nombreMsg, setNombreMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const handleUpdateNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    setNombreMsg(null);

    if (nombre.trim().length < 3) {
      setNombreMsg({ type: 'error', text: 'El nombre debe tener al menos 3 caracteres' });
      return;
    }

    setSavingNombre(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ nombre: nombre.trim() } as never)
        .eq('id', usuario!.id);

      if (error) {
        setNombreMsg({ type: 'error', text: 'Error al actualizar nombre' });
      } else {
        setNombreMsg({ type: 'success', text: 'Nombre actualizado correctamente' });
        // Actualizar el nombre en el contexto recargando
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      setNombreMsg({ type: 'error', text: 'Error de conexion' });
    } finally {
      setSavingNombre(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'La nueva contrasena debe tener al menos 6 caracteres' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Las contrasenas no coinciden' });
      return;
    }

    setSavingPassword(true);
    try {
      // Verificar contrasena actual intentando re-autenticar
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: usuario!.email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordMsg({ type: 'error', text: 'La contrasena actual es incorrecta' });
        setSavingPassword(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordMsg({ type: 'error', text: error.message });
      } else {
        setPasswordMsg({ type: 'success', text: 'Contrasena actualizada correctamente' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch {
      setPasswordMsg({ type: 'error', text: 'Error de conexion' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (!usuario) return null;

  return (
    <MainLayout title="Mi Perfil">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Info del usuario */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-azutrans-yellow text-azutrans-dark font-bold text-lg">
                  {getInitials(usuario.nombre)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{usuario.nombre}</h2>
                <p className="text-sm text-muted-foreground">{usuario.email}</p>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {usuario.rol}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cambiar nombre */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cambiar Nombre</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateNombre} className="space-y-4">
              {nombreMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  nombreMsg.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {nombreMsg.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{nombreMsg.text}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={savingNombre}
                />
              </div>
              <Button type="submit" disabled={savingNombre || nombre.trim() === usuario.nombre}>
                {savingNombre ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Nombre'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Cambiar contrasena */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cambiar Contrasena</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {passwordMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                  passwordMsg.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {passwordMsg.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contrasena actual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={savingPassword}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contrasena</Label>
                <Input
                  id="newPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={savingPassword}
                  required
                  placeholder="Minimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contrasena</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={savingPassword}
                  required
                />
              </div>
              <Button type="submit" disabled={savingPassword || !currentPassword || !newPassword}>
                {savingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Cambiar Contrasena'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
