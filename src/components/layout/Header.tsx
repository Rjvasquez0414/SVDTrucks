'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { contarAlertasPorPrioridad } from '@/lib/queries/alertas';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { usuario, logout } = useAuth();
  const [alertasCount, setAlertasCount] = useState({ alta: 0, media: 0, baja: 0 });

  useEffect(() => {
    async function loadAlertas() {
      const counts = await contarAlertasPorPrioridad();
      setAlertasCount(counts);
    }
    loadAlertas();
  }, []);

  const totalAlertas = alertasCount.alta + alertasCount.media + alertasCount.baja;
  const alertasAltas = alertasCount.alta;

  // Obtener iniciales del nombre
  const getInitials = (nombre: string) => {
    return nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Title */}
      <h1 className="text-xl font-semibold">{title}</h1>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar vehiculo, placa..."
            className="w-64 pl-9"
          />
        </div>

        {/* Notifications */}
        <Link href="/alertas">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {totalAlertas > 0 && (
              <Badge
                variant={alertasAltas > 0 ? 'destructive' : 'secondary'}
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                {totalAlertas}
              </Badge>
            )}
          </Button>
        </Link>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {usuario ? getInitials(usuario.nombre) : 'US'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">
                  {usuario?.nombre || 'Usuario'}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {usuario?.rol || 'Sin rol'}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{usuario?.nombre}</p>
                <p className="text-xs text-muted-foreground">{usuario?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Configuracion
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
