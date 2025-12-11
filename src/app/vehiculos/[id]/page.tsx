'use client';

import { use, useState, useEffect } from 'react';
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
  Loader2,
  User,
} from 'lucide-react';
import { getVehiculoById } from '@/lib/queries/vehiculos';
import { EstadoVehiculo, VehiculoCompleto } from '@/types/database';
import { cn, formatNumber } from '@/lib/utils';
import Link from 'next/link';

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
  const [vehiculo, setVehiculo] = useState<VehiculoCompleto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVehiculo() {
      setLoading(true);
      const data = await getVehiculoById(id);
      setVehiculo(data);
      setLoading(false);
    }
    loadVehiculo();
  }, [id]);

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return 'No registrada';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <MainLayout title="Cargando...">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando vehiculo...</p>
        </div>
      </MainLayout>
    );
  }

  if (!vehiculo) {
    return (
      <MainLayout title="Vehiculo no encontrado">
        <div className="flex flex-col items-center justify-center py-20">
          <Truck className="h-16 w-16 text-muted-foreground/30" />
          <h2 className="mt-4 text-lg font-semibold">Vehiculo no encontrado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            El vehiculo que buscas no existe o fue eliminado
          </p>
          <Link href="/vehiculos" className="mt-4">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a vehiculos
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const estadoInfo = estadoConfig[vehiculo.estado];
  const EstadoIcon = estadoInfo.icon;

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
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Gauge className="h-4 w-4" />
                {formatNumber(vehiculo.kilometraje)} km
              </span>
              <span className="capitalize">{vehiculo.tipo}</span>
              {vehiculo.color && <span>Color: {vehiculo.color}</span>}
            </div>
            {vehiculo.conductores && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Conductor: <strong>{vehiculo.conductores.nombre}</strong></span>
                {vehiculo.conductores.cedula && (
                  <span className="text-muted-foreground">
                    (C.C. {vehiculo.conductores.cedula})
                  </span>
                )}
              </div>
            )}
            {vehiculo.remolques && (
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-4 w-4" />
                <span>Remolque: {vehiculo.remolques.placa}</span>
              </div>
            )}
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

      {/* Content tabs */}
      <Tabs defaultValue="general" className="mt-6">
        <TabsList>
          <TabsTrigger value="general">Informacion General</TabsTrigger>
          <TabsTrigger value="historial">Historial (0)</TabsTrigger>
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
                {vehiculo.numero_motor && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">No. Motor</span>
                      <span className="font-medium text-xs">{vehiculo.numero_motor}</span>
                    </div>
                  </>
                )}
                {vehiculo.numero_chasis && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">No. Chasis</span>
                      <span className="font-medium text-xs">{vehiculo.numero_chasis}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Conductor y Remolque */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conductor y Remolque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conductor</span>
                  <span className="font-medium">
                    {vehiculo.conductores?.nombre || 'Sin asignar'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cedula</span>
                  <span className="font-medium">
                    {vehiculo.conductores?.cedula || '-'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remolque</span>
                  <span className="font-medium">
                    {vehiculo.remolques?.placa || 'Sin asignar'}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha Adquisicion</span>
                  <span className="font-medium">{formatearFecha(vehiculo.fecha_adquisicion)}</span>
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
                        Vence: {vehiculo.vencimiento_soat ? formatearFecha(vehiculo.vencimiento_soat) : 'No registrado'}
                      </p>
                    </div>
                  </div>
                  {vehiculo.vencimiento_soat ? (
                    <Badge
                      variant={
                        new Date(vehiculo.vencimiento_soat) < new Date()
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {new Date(vehiculo.vencimiento_soat) < new Date() ? 'Vencido' : 'Vigente'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Sin registrar</Badge>
                  )}
                </div>

                {/* Técnico-mecánica */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Revision Tecnicomecanica</p>
                      <p className="text-sm text-muted-foreground">
                        Vence: {vehiculo.vencimiento_tecnomecanica ? formatearFecha(vehiculo.vencimiento_tecnomecanica) : 'No registrado'}
                      </p>
                    </div>
                  </div>
                  {vehiculo.vencimiento_tecnomecanica ? (
                    <Badge
                      variant={
                        new Date(vehiculo.vencimiento_tecnomecanica) < new Date()
                          ? 'destructive'
                          : 'outline'
                      }
                    >
                      {new Date(vehiculo.vencimiento_tecnomecanica) < new Date()
                        ? 'Vencido'
                        : 'Vigente'}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Sin registrar</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
