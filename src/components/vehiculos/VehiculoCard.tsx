'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Calendar, Gauge, Eye, MoreVertical, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VehiculoCompleto, EstadoVehiculo } from '@/types/database';
import { cn, formatNumber } from '@/lib/utils';
import Link from 'next/link';

interface VehiculoCardProps {
  vehiculo: VehiculoCompleto;
}

const estadoBadge: Record<EstadoVehiculo, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  activo: { label: 'Activo', variant: 'default' },
  en_mantenimiento: { label: 'En Mantenimiento', variant: 'secondary' },
  inactivo: { label: 'Inactivo', variant: 'destructive' },
};

const tipoLabel: Record<string, string> = {
  camion: 'Camion',
  tractomula: 'Tractomula',
  volqueta: 'Volqueta',
};

export function VehiculoCard({ vehiculo }: VehiculoCardProps) {
  const estado = estadoBadge[vehiculo.estado];

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-0">
        {/* Header con imagen/placeholder */}
        <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-lg flex items-center justify-center">
          <Truck className="h-16 w-16 text-slate-400" />
          <div className="absolute top-2 right-2">
            <Badge variant={estado.variant}>{estado.label}</Badge>
          </div>
          {vehiculo.color && (
            <div className="absolute bottom-2 left-2">
              <span className="text-xs bg-white/80 px-2 py-1 rounded text-slate-600">
                {vehiculo.color}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{vehiculo.placa}</h3>
              <p className="text-sm text-muted-foreground">
                {vehiculo.marca} {vehiculo.modelo}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/vehiculos/${vehiculo.id}`}>
                    Ver detalles
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>Editar</DropdownMenuItem>
                <DropdownMenuItem>Registrar mantenimiento</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Info chips */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Gauge className="h-4 w-4" />
              <span>{formatNumber(vehiculo.kilometraje)} km</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{vehiculo.año} - {tipoLabel[vehiculo.tipo]}</span>
            </div>
            {vehiculo.conductores && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="truncate">{vehiculo.conductores.nombre}</span>
              </div>
            )}
          </div>

          {/* Action button */}
          <div className="mt-4">
            <Link href={`/vehiculos/${vehiculo.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalles
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
