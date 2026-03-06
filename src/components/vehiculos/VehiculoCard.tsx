'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, Calendar, Gauge, Eye, MoreVertical, User, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VehiculoCompleto, EstadoVehiculo } from '@/types/database';
import { deleteVehiculo } from '@/lib/queries/vehiculos';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';

interface VehiculoCardProps {
  vehiculo: VehiculoCompleto;
  onEditar?: (vehiculo: VehiculoCompleto) => void;
  onEliminar?: () => void;
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

export function VehiculoCard({ vehiculo, onEditar, onEliminar }: VehiculoCardProps) {
  const estado = estadoBadge[vehiculo.estado];
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await deleteVehiculo(vehiculo.id);
      setConfirmOpen(false);
      onEliminar?.();
    } catch (err) {
      console.error('Error eliminando vehiculo:', err);
      alert('Error al eliminar el vehiculo. Puede tener mantenimientos o documentos asociados.');
    } finally {
      setEliminando(false);
    }
  };

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
                <DropdownMenuItem onClick={() => onEditar?.(vehiculo)}>
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/mantenimientos/nuevo?vehiculo=${vehiculo.id}`}>
                    Registrar mantenimiento
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
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
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar vehiculo {vehiculo.placa}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente el vehiculo
              {' '}<strong>{vehiculo.placa}</strong> ({vehiculo.marca} {vehiculo.modelo}) del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={eliminando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEliminar}
              disabled={eliminando}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
