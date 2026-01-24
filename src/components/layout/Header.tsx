'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Search, User, LogOut, Settings, Truck, Loader2 } from 'lucide-react';
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
import { searchVehiculos } from '@/lib/queries/vehiculos';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { VehiculoCompleto } from '@/types/database';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { usuario, logout } = useAuth();
  const router = useRouter();
  const [alertasCount, setAlertasCount] = useState({ alta: 0, media: 0, baja: 0 });

  // Estados para la búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VehiculoCompleto[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadAlertas() {
      const counts = await contarAlertasPorPrioridad();
      setAlertasCount(counts);
    }
    loadAlertas();
  }, []);

  // Búsqueda con debounce
  const handleSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearching(true);
    try {
      const results = await searchVehiculos(query);
      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Cancelar búsqueda anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce de 300ms
    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (vehiculoId: string) => {
    setShowResults(false);
    setSearchQuery('');
    router.push(`/vehiculos/${vehiculoId}`);
  };

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
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar vehiculo, placa..."
            className="w-64 pl-9"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          />

          {/* Dropdown de resultados */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
              {searching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-1">
                  {searchResults.map((vehiculo) => (
                    <button
                      key={vehiculo.id}
                      className="w-full px-3 py-2 flex items-center gap-3 hover:bg-muted transition-colors text-left"
                      onClick={() => handleResultClick(vehiculo.id)}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{vehiculo.placa}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {vehiculo.marca} {vehiculo.modelo} ({vehiculo.año})
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {vehiculo.estado === 'activo' ? 'Activo' : vehiculo.estado === 'en_mantenimiento' ? 'Mant.' : 'Inactivo'}
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No se encontraron vehiculos
                  </p>
                </div>
              )}
            </div>
          )}
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
