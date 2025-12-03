'use client';

import { use } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Truck,
  Calendar,
  Gauge,
  FileText,
  Wrench,
  AlertTriangle,
  ArrowLeft,
  Edit,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { getVehiculoById, vehiculos } from '@/data/vehiculos';
import { getMantenimientosByVehiculo } from '@/data/mantenimientos';
import { getAlertasByVehiculo } from '@/data/alertas';
import { getCategoriaInfo } from '@/data/tipos-mantenimiento';
import { EstadoVehiculo } from '@/types';
import { cn, formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

const estadoConfig: Record<EstadoVehiculo, { label: string; color: string; icon: typeof CheckCircle }> = {
  activo: { label: 'Activo', color: 'text-green-600 bg-green-100', icon: CheckCircle },
  en_mantenimiento: { label: 'En Mantenimiento', color: 'text-yellow-600 bg-yellow-100', icon: Clock },
  inactivo: { label: 'Inactivo', color: 'text-red-600 bg-red-100', icon: XCircle },
};

export default function VehiculoDetallePage({ params }: PageProps) {
  const { id } = use(params);
  const vehiculo = getVehiculoById(id);

  if (!vehiculo) {
    notFound();
  }

  const mantenimientos = getMantenimientosByVehiculo(id);
  const alertas = getAlertasByVehiculo(id);
  const estadoInfo = estadoConfig[vehiculo.estado];
  const EstadoIcon = estadoInfo.icon;

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatearPesos = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  const costoTotal = mantenimientos.reduce((sum, m) => sum + m.costo, 0);

  return (
    <MainLayout title={`Vehiculo ${vehiculo.placa}`}>
      {/* Back button */}
      <div className="mb-4">
        <Link href="/vehiculos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a vehiculos
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-muted">
            <Truck className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{vehiculo.placa}</h1>
              <Badge className={cn('gap-1', estadoInfo.color)} variant="outline">
                <EstadoIcon className="h-3 w-3" />
                {estadoInfo.label}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">
              {vehiculo.marca} {vehiculo.modelo} ({vehiculo.año})
            </p>
            <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Gauge className="h-4 w-4" />
                {formatNumber(vehiculo.kilometraje)} km
              </span>
              <span className="capitalize">{vehiculo.tipo}</span>
              {vehiculo.color && <span>Color: {vehiculo.color}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Link href="/mantenimientos/nuevo">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Mantenimiento
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerts banner */}
      {alertas.length > 0 && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">
              {alertas.length} alerta{alertas.length > 1 ? 's' : ''} pendiente{alertas.length > 1 ? 's' : ''}
            </span>
          </div>
          <ul className="mt-2 space-y-1">
            {alertas.map((alerta) => (
              <li key={alerta.id} className="text-sm text-yellow-700">
                - {alerta.mensaje}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content tabs */}
      <Tabs defaultValue="general" className="mt-6">
        <TabsList>
          <TabsTrigger value="general">Informacion General</TabsTrigger>
          <TabsTrigger value="historial">Historial ({mantenimientos.length})</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Datos del vehículo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos del Vehiculo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Placa</span>
                  <span className="font-medium">{vehiculo.placa}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marca</span>
                  <span className="font-medium">{vehiculo.marca}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modelo</span>
                  <span className="font-medium">{vehiculo.modelo}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ano</span>
                  <span className="font-medium">{vehiculo.año}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium capitalize">{vehiculo.tipo}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kilometraje</span>
                  <span className="font-medium">{formatNumber(vehiculo.kilometraje)} km</span>
                </div>
                {vehiculo.numeroMotor && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">No. Motor</span>
                      <span className="font-medium text-xs">{vehiculo.numeroMotor}</span>
                    </div>
                  </>
                )}
                {vehiculo.numeroChasis && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">No. Chasis</span>
                      <span className="font-medium text-xs">{vehiculo.numeroChasis}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estadisticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Mantenimientos</span>
                  <span className="font-medium">{mantenimientos.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preventivos</span>
                  <span className="font-medium">
                    {mantenimientos.filter((m) => m.tipo === 'preventivo').length}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Correctivos</span>
                  <span className="font-medium">
                    {mantenimientos.filter((m) => m.tipo === 'correctivo').length}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Costo Total</span>
                  <span className="font-medium">{formatearPesos(costoTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha Adquisicion</span>
                  <span className="font-medium">{formatearFecha(vehiculo.fechaAdquisicion)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Historial de Mantenimientos</CardTitle>
            </CardHeader>
            <CardContent>
              {mantenimientos.length > 0 ? (
                <div className="space-y-4">
                  {mantenimientos.map((m) => {
                    const categoriaInfo = getCategoriaInfo(m.categoria);
                    return (
                      <div
                        key={m.id}
                        className="flex items-start gap-4 rounded-lg border p-4"
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                            m.tipo === 'preventivo' ? 'bg-blue-100' : 'bg-orange-100'
                          )}
                        >
                          <Wrench
                            className={cn(
                              'h-5 w-5',
                              m.tipo === 'preventivo' ? 'text-blue-600' : 'text-orange-600'
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">
                                {categoriaInfo?.nombre || m.categoria}
                              </p>
                              <p className="text-sm text-muted-foreground">{m.descripcion}</p>
                            </div>
                            <Badge variant={m.tipo === 'preventivo' ? 'secondary' : 'outline'}>
                              {m.tipo === 'preventivo' ? 'Preventivo' : 'Correctivo'}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatearFecha(m.fecha)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Gauge className="h-4 w-4" />
                              {formatNumber(m.kilometraje)} km
                            </span>
                            <span className="font-medium text-foreground">
                              {formatearPesos(m.costo)}
                            </span>
                          </div>
                          {m.observaciones && (
                            <p className="mt-2 text-sm italic text-muted-foreground">
                              {m.observaciones}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Wrench className="h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-semibold">Sin historial</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Este vehiculo no tiene mantenimientos registrados
                  </p>
                  <Link href="/mantenimientos/nuevo" className="mt-4">
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Mantenimiento
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos y Vencimientos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* SOAT */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">SOAT</p>
                      <p className="text-sm text-muted-foreground">
                        Vence: {formatearFecha(vehiculo.vencimientoSOAT)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      new Date(vehiculo.vencimientoSOAT) < new Date()
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {new Date(vehiculo.vencimientoSOAT) < new Date() ? 'Vencido' : 'Vigente'}
                  </Badge>
                </div>

                {/* Técnico-mecánica */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Revision Tecnicomecanica</p>
                      <p className="text-sm text-muted-foreground">
                        Vence: {formatearFecha(vehiculo.vencimientoTecnicomecanica)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      new Date(vehiculo.vencimientoTecnicomecanica) < new Date()
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {new Date(vehiculo.vencimientoTecnicomecanica) < new Date()
                      ? 'Vencido'
                      : 'Vigente'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
