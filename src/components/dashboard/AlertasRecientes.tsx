'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Clock, FileWarning, Truck, ArrowRight } from 'lucide-react';
import { getAlertasPendientes } from '@/data/alertas';
import { getVehiculoById } from '@/data/vehiculos';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { TipoAlerta, PrioridadAlerta } from '@/types';

const iconosPorTipo: Record<TipoAlerta, typeof AlertTriangle> = {
  mantenimiento_kilometraje: Truck,
  mantenimiento_tiempo: Clock,
  vencimiento_soat: FileWarning,
  vencimiento_tecnomecanica: FileWarning,
  vehiculo_inactivo: Truck,
};

const coloresPorPrioridad: Record<PrioridadAlerta, string> = {
  alta: 'border-l-red-500 bg-red-50',
  media: 'border-l-yellow-500 bg-yellow-50',
  baja: 'border-l-blue-500 bg-blue-50',
};

const badgePorPrioridad: Record<PrioridadAlerta, 'destructive' | 'secondary' | 'outline'> = {
  alta: 'destructive',
  media: 'secondary',
  baja: 'outline',
};

export function AlertasRecientes() {
  const alertas = getAlertasPendientes().slice(0, 5);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Alertas Recientes</CardTitle>
        <Link href="/alertas">
          <Button variant="ghost" size="sm" className="text-xs">
            Ver todas
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {alertas.map((alerta) => {
              const vehiculo = getVehiculoById(alerta.vehiculoId);
              const Icono = iconosPorTipo[alerta.tipo];

              return (
                <div
                  key={alerta.id}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border-l-4 p-3',
                    coloresPorPrioridad[alerta.prioridad]
                  )}
                >
                  <div className="mt-0.5">
                    <Icono className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">
                        {alerta.mensaje}
                      </p>
                      <Badge variant={badgePorPrioridad[alerta.prioridad]} className="shrink-0 text-xs">
                        {alerta.prioridad}
                      </Badge>
                    </div>
                    {vehiculo && (
                      <p className="text-xs text-muted-foreground">
                        {vehiculo.marca} {vehiculo.modelo} - {vehiculo.placa}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {alertas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  No hay alertas pendientes
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
