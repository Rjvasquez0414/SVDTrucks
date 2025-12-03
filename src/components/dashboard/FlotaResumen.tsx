'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Truck, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { vehiculos } from '@/data/vehiculos';
import Link from 'next/link';
import { EstadoVehiculo } from '@/types';
import { cn, formatNumber } from '@/lib/utils';

const estadoConfig: Record<EstadoVehiculo, { label: string; color: string; icon: typeof Truck }> = {
  activo: {
    label: 'Activo',
    color: 'bg-green-500',
    icon: CheckCircle,
  },
  en_mantenimiento: {
    label: 'En Mantenimiento',
    color: 'bg-yellow-500',
    icon: AlertCircle,
  },
  inactivo: {
    label: 'Inactivo',
    color: 'bg-red-500',
    icon: XCircle,
  },
};

export function FlotaResumen() {
  const vehiculosPorEstado = vehiculos.reduce(
    (acc, v) => {
      acc[v.estado] = (acc[v.estado] || 0) + 1;
      return acc;
    },
    {} as Record<EstadoVehiculo, number>
  );

  const ultimosVehiculos = vehiculos.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Estado de la Flota</CardTitle>
        <Link href="/vehiculos">
          <Button variant="ghost" size="sm" className="text-xs">
            Ver todos
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {/* Estado summary */}
        <div className="mb-4 flex gap-4">
          {(Object.entries(estadoConfig) as [EstadoVehiculo, typeof estadoConfig.activo][]).map(
            ([estado, config]) => (
              <div key={estado} className="flex items-center gap-2">
                <div className={cn('h-3 w-3 rounded-full', config.color)} />
                <span className="text-sm">
                  {vehiculosPorEstado[estado] || 0} {config.label}
                </span>
              </div>
            )
          )}
        </div>

        {/* Lista de vehículos */}
        <div className="space-y-3">
          {ultimosVehiculos.map((vehiculo) => {
            const config = estadoConfig[vehiculo.estado];
            const Icon = config.icon;

            return (
              <Link
                key={vehiculo.id}
                href={`/vehiculos/${vehiculo.id}`}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{vehiculo.placa}</p>
                    <p className="text-xs text-muted-foreground">
                      {vehiculo.marca} {vehiculo.modelo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(vehiculo.kilometraje)} km
                  </span>
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      vehiculo.estado === 'activo' && 'text-green-500',
                      vehiculo.estado === 'en_mantenimiento' && 'text-yellow-500',
                      vehiculo.estado === 'inactivo' && 'text-red-500'
                    )}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
