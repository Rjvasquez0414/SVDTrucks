'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  FileWarning,
  Truck,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { getAlertasPendientes, contarAlertasPorPrioridad } from '@/data/alertas';
import { getVehiculoById } from '@/data/vehiculos';
import { Alerta, TipoAlerta, PrioridadAlerta } from '@/types';
import { cn, formatNumber } from '@/lib/utils';
import Link from 'next/link';

const iconosPorTipo: Record<TipoAlerta, typeof AlertTriangle> = {
  mantenimiento_kilometraje: Truck,
  mantenimiento_tiempo: Clock,
  vencimiento_soat: FileWarning,
  vencimiento_tecnomecanica: FileWarning,
  vehiculo_inactivo: Truck,
};

const nombresTipo: Record<TipoAlerta, string> = {
  mantenimiento_kilometraje: 'Mantenimiento por Kilometraje',
  mantenimiento_tiempo: 'Mantenimiento por Tiempo',
  vencimiento_soat: 'Vencimiento de SOAT',
  vencimiento_tecnomecanica: 'Vencimiento Tecnicomecanica',
  vehiculo_inactivo: 'Vehiculo Inactivo',
};

const coloresPorPrioridad: Record<PrioridadAlerta, string> = {
  alta: 'border-l-red-500 bg-red-50',
  media: 'border-l-yellow-500 bg-yellow-50',
  baja: 'border-l-blue-500 bg-blue-50',
};

export default function AlertasPage() {
  const alertas = getAlertasPendientes();
  const conteo = contarAlertasPorPrioridad();
  const [alertasLocales, setAlertasLocales] = useState(alertas);

  const marcarAtendida = (id: string) => {
    setAlertasLocales(alertasLocales.filter((a) => a.id !== id));
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const AlertaCard = ({ alerta }: { alerta: Alerta }) => {
    const vehiculo = getVehiculoById(alerta.vehiculoId);
    const Icono = iconosPorTipo[alerta.tipo];

    return (
      <div
        className={cn(
          'flex items-start gap-4 rounded-lg border-l-4 bg-card p-4 shadow-sm',
          coloresPorPrioridad[alerta.prioridad]
        )}
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            alerta.prioridad === 'alta' && 'bg-red-100',
            alerta.prioridad === 'media' && 'bg-yellow-100',
            alerta.prioridad === 'baja' && 'bg-blue-100'
          )}
        >
          <Icono
            className={cn(
              'h-5 w-5',
              alerta.prioridad === 'alta' && 'text-red-600',
              alerta.prioridad === 'media' && 'text-yellow-600',
              alerta.prioridad === 'baja' && 'text-blue-600'
            )}
          />
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{alerta.mensaje}</p>
              <p className="text-sm text-muted-foreground">
                {nombresTipo[alerta.tipo]}
              </p>
            </div>
            <Badge
              variant={
                alerta.prioridad === 'alta'
                  ? 'destructive'
                  : alerta.prioridad === 'media'
                  ? 'secondary'
                  : 'outline'
              }
            >
              Prioridad {alerta.prioridad}
            </Badge>
          </div>

          {vehiculo && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>
                {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}
              </span>
            </div>
          )}

          {alerta.kilometrajeActual && alerta.kilometrajeLimite && (
            <p className="text-sm text-muted-foreground">
              Kilometraje actual: {formatNumber(alerta.kilometrajeActual)} km /
              Limite: {formatNumber(alerta.kilometrajeLimite)} km
            </p>
          )}

          {alerta.fechaLimite && (
            <p className="text-sm text-muted-foreground">
              Fecha limite: {formatearFecha(alerta.fechaLimite)}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">
              Generada: {formatearFecha(alerta.fechaGenerada)}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {vehiculo && (
              <Link href={`/vehiculos/${vehiculo.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Vehiculo
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => marcarAtendida(alerta.id)}
            >
              <Check className="h-4 w-4 mr-1" />
              Marcar Atendida
            </Button>
            <Button variant="ghost" size="sm">
              <X className="h-4 w-4 mr-1" />
              Descartar
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout title="Centro de Alertas">
      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-red-600">{conteo.alta}</p>
                <p className="text-sm text-muted-foreground">Prioridad Alta</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-yellow-600">{conteo.media}</p>
                <p className="text-sm text-muted-foreground">Prioridad Media</p>
              </div>
              <Bell className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">{conteo.baja}</p>
                <p className="text-sm text-muted-foreground">Prioridad Baja</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts list */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">
            Alertas Pendientes ({alertasLocales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todas">
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="alta">
                Alta ({alertasLocales.filter((a) => a.prioridad === 'alta').length})
              </TabsTrigger>
              <TabsTrigger value="media">
                Media ({alertasLocales.filter((a) => a.prioridad === 'media').length})
              </TabsTrigger>
              <TabsTrigger value="baja">
                Baja ({alertasLocales.filter((a) => a.prioridad === 'baja').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todas" className="mt-4">
              <div className="space-y-4">
                {alertasLocales.map((alerta) => (
                  <AlertaCard key={alerta.id} alerta={alerta} />
                ))}
                {alertasLocales.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <h3 className="mt-4 text-lg font-semibold">Todo en orden</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No hay alertas pendientes por atender
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="alta" className="mt-4">
              <div className="space-y-4">
                {alertasLocales
                  .filter((a) => a.prioridad === 'alta')
                  .map((alerta) => (
                    <AlertaCard key={alerta.id} alerta={alerta} />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-4">
              <div className="space-y-4">
                {alertasLocales
                  .filter((a) => a.prioridad === 'media')
                  .map((alerta) => (
                    <AlertaCard key={alerta.id} alerta={alerta} />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="baja" className="mt-4">
              <div className="space-y-4">
                {alertasLocales
                  .filter((a) => a.prioridad === 'baja')
                  .map((alerta) => (
                    <AlertaCard key={alerta.id} alerta={alerta} />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
