'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Wrench } from 'lucide-react';
import { vehiculos } from '@/data/vehiculos';
import { mantenimientos } from '@/data/mantenimientos';
import { getCategoriaInfo } from '@/data/tipos-mantenimiento';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';

interface ProximoMantenimiento {
  vehiculoId: string;
  placa: string;
  marca: string;
  modelo: string;
  categoria: string;
  categoriaNombre: string;
  kilometrajeActual: number;
  kilometrajeLimite: number;
  progreso: number;
}

function calcularProximosMantenimientos(): ProximoMantenimiento[] {
  const proximos: ProximoMantenimiento[] = [];

  vehiculos.forEach((vehiculo) => {
    if (vehiculo.estado === 'inactivo') return;

    const mantenimientosVehiculo = mantenimientos.filter(
      (m) => m.vehiculoId === vehiculo.id && m.proximoMantenimiento?.kilometraje
    );

    mantenimientosVehiculo.forEach((m) => {
      if (!m.proximoMantenimiento?.kilometraje) return;

      const kmRestantes = m.proximoMantenimiento.kilometraje - vehiculo.kilometraje;
      if (kmRestantes < 5000 && kmRestantes > -2000) {
        const categoriaInfo = getCategoriaInfo(m.categoria);
        const intervalo = categoriaInfo?.intervaloKm || 15000;
        const kmDesdeUltimo = vehiculo.kilometraje - m.kilometraje;
        const progreso = Math.min(100, Math.max(0, (kmDesdeUltimo / intervalo) * 100));

        proximos.push({
          vehiculoId: vehiculo.id,
          placa: vehiculo.placa,
          marca: vehiculo.marca,
          modelo: vehiculo.modelo,
          categoria: m.categoria,
          categoriaNombre: categoriaInfo?.nombre || m.categoria,
          kilometrajeActual: vehiculo.kilometraje,
          kilometrajeLimite: m.proximoMantenimiento.kilometraje,
          progreso,
        });
      }
    });
  });

  return proximos
    .sort((a, b) => (a.kilometrajeLimite - a.kilometrajeActual) - (b.kilometrajeLimite - b.kilometrajeActual))
    .slice(0, 5);
}

export function ProximosMantenimientos() {
  const proximos = calcularProximosMantenimientos();

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Proximos Mantenimientos</CardTitle>
        <Link href="/mantenimientos">
          <Button variant="ghost" size="sm" className="text-xs">
            Ver todos
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {proximos.map((item, index) => {
            const kmRestantes = item.kilometrajeLimite - item.kilometrajeActual;
            const isUrgente = kmRestantes < 500;
            const isProximo = kmRestantes < 2000;

            return (
              <div key={`${item.vehiculoId}-${item.categoria}-${index}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.placa}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.categoriaNombre}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={isUrgente ? 'destructive' : isProximo ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {kmRestantes > 0 ? `${formatNumber(kmRestantes)} km` : 'Vencido'}
                  </Badge>
                </div>
                <Progress value={item.progreso} className="h-1.5" />
              </div>
            );
          })}
          {proximos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Wrench className="h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No hay mantenimientos proximos
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
