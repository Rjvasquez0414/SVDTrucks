'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Truck,
  Container,
  User,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  Loader2,
  Calendar,
} from 'lucide-react';
import { getVehiculos } from '@/lib/queries/vehiculos';
import { VehiculoCompleto } from '@/types/database';
import { cn } from '@/lib/utils';

// Tipos de documentos por categoria
const documentosPorCategoria = {
  cabezote: [
    { tipo: 'soat', nombre: 'SOAT' },
    { tipo: 'poliza_rc_hidrocarburos', nombre: 'Poliza RC Hidrocarburos' },
    { tipo: 'revision_tecnomecanica', nombre: 'Revision Tecnomecanica' },
  ],
  tanque: [
    { tipo: 'poliza_rc_hidrocarburos', nombre: 'Poliza RC Hidrocarburos' },
    { tipo: 'prueba_hidrostatica', nombre: 'Prueba Hidrostatica' },
    { tipo: 'certificado_luz_negra', nombre: 'Certificado Luz Negra (Copetran)' },
    { tipo: 'programa_mantenimiento_copetran', nombre: 'Programa de Mantenimiento (Copetran)' },
    { tipo: 'certificacion_quinta_rueda', nombre: 'Certificacion Quinta Rueda (Copetran)' },
  ],
  conductor: [
    { tipo: 'eps', nombre: 'EPS' },
    { tipo: 'arl', nombre: 'ARL' },
    { tipo: 'curso_mercancias_peligrosas', nombre: 'Curso Mercancias Peligrosas' },
    { tipo: 'curso_hse_ecopetrol', nombre: 'Curso HSE Ecopetrol' },
    { tipo: 'licencia_conduccion', nombre: 'Licencia de Conduccion' },
    { tipo: 'curso_manejo_defensivo', nombre: 'Curso Manejo Defensivo' },
    { tipo: 'curso_trabajo_alturas', nombre: 'Curso Trabajo en Alturas' },
  ],
  polizas: [
    { tipo: 'poliza_todo_riesgo_cabezote', nombre: 'Poliza Todo Riesgo Cabezote' },
    { tipo: 'poliza_todo_riesgo_tanque', nombre: 'Poliza Todo Riesgo Tanque' },
    { tipo: 'poliza_decreto_1079', nombre: 'Poliza Decreto 1079/2015' },
    { tipo: 'poliza_rce_copetran', nombre: 'Poliza RCE (Copetran)' },
    { tipo: 'poliza_rce_exceso_copetran', nombre: 'Poliza RCE en Exceso (Copetran)' },
  ],
};

// Componente para mostrar un documento
function DocumentoCard({
  nombre,
  tipo,
  fechaVencimiento,
  estado,
}: {
  nombre: string;
  tipo: string;
  fechaVencimiento?: string | null;
  estado: 'vigente' | 'por_vencer' | 'vencido' | 'sin_registrar';
}) {
  const estadoConfig = {
    vigente: {
      label: 'Vigente',
      color: 'text-green-600 bg-green-100',
      icon: CheckCircle,
    },
    por_vencer: {
      label: 'Por Vencer',
      color: 'text-yellow-600 bg-yellow-100',
      icon: Clock,
    },
    vencido: {
      label: 'Vencido',
      color: 'text-red-600 bg-red-100',
      icon: XCircle,
    },
    sin_registrar: {
      label: 'Sin Registrar',
      color: 'text-gray-600 bg-gray-100',
      icon: AlertTriangle,
    },
  };

  const config = estadoConfig[estado];
  const Icon = config.icon;

  const formatearFecha = (fecha: string | null | undefined) => {
    if (!fecha) return 'No registrada';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <FileText className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{nombre}</p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Vence: {formatearFecha(fechaVencimiento)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={cn('gap-1', config.color)} variant="outline">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      </div>
    </div>
  );
}

// Componente para una categoria de documentos
function CategoriaDocumentos({
  titulo,
  icon: IconComponent,
  documentos,
  entidadNombre,
}: {
  titulo: string;
  icon: typeof Truck;
  documentos: { tipo: string; nombre: string }[];
  entidadNombre?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {titulo}
          </CardTitle>
          {entidadNombre && (
            <Badge variant="secondary">{entidadNombre}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {documentos.map((doc) => (
          <DocumentoCard
            key={doc.tipo}
            nombre={doc.nombre}
            tipo={doc.tipo}
            fechaVencimiento={null}
            estado="sin_registrar"
          />
        ))}
      </CardContent>
    </Card>
  );
}

export default function DocumentacionPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoCompleto[]>([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getVehiculos();
      setVehiculos(data);
      if (data.length > 0) {
        setSelectedVehiculo(data[0].id);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === selectedVehiculo);

  if (loading) {
    return (
      <MainLayout title="Documentacion">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando documentacion...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Documentacion">
      {/* Header con selector de vehiculo */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold">Control de Documentos</h2>
          <p className="text-sm text-muted-foreground">
            Visualiza y gestiona los documentos de cada vehiculo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedVehiculo} onValueChange={setSelectedVehiculo}>
            <SelectTrigger className="w-[250px]">
              <SelectValue placeholder="Seleccionar vehiculo" />
            </SelectTrigger>
            <SelectContent>
              {vehiculos.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    {v.placa} - {v.marca} {v.modelo}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Documento
          </Button>
        </div>
      </div>

      {/* Info del vehiculo seleccionado */}
      {vehiculoSeleccionado && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cabezote</p>
                  <p className="font-semibold">{vehiculoSeleccionado.placa}</p>
                </div>
              </div>

              {vehiculoSeleccionado.remolques && (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                    <Container className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tanque</p>
                    <p className="font-semibold">{vehiculoSeleccionado.remolques.placa}</p>
                  </div>
                </div>
              )}

              {vehiculoSeleccionado.conductores && (
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Conductor</p>
                    <p className="font-semibold">{vehiculoSeleccionado.conductores.nombre}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de categorias */}
      <Tabs defaultValue="cabezote" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cabezote" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Cabezote</span>
          </TabsTrigger>
          <TabsTrigger value="tanque" className="flex items-center gap-2">
            <Container className="h-4 w-4" />
            <span className="hidden sm:inline">Tanque</span>
          </TabsTrigger>
          <TabsTrigger value="conductor" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Conductor</span>
          </TabsTrigger>
          <TabsTrigger value="polizas" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Polizas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cabezote">
          <CategoriaDocumentos
            titulo="Documentos del Cabezote"
            icon={Truck}
            documentos={documentosPorCategoria.cabezote}
            entidadNombre={vehiculoSeleccionado?.placa}
          />
        </TabsContent>

        <TabsContent value="tanque">
          <CategoriaDocumentos
            titulo="Documentos del Tanque"
            icon={Container}
            documentos={documentosPorCategoria.tanque}
            entidadNombre={vehiculoSeleccionado?.remolques?.placa || 'Sin asignar'}
          />
        </TabsContent>

        <TabsContent value="conductor">
          <CategoriaDocumentos
            titulo="Documentos del Conductor"
            icon={User}
            documentos={documentosPorCategoria.conductor}
            entidadNombre={vehiculoSeleccionado?.conductores?.nombre || 'Sin asignar'}
          />
        </TabsContent>

        <TabsContent value="polizas">
          <CategoriaDocumentos
            titulo="Polizas de Seguros"
            icon={Shield}
            documentos={documentosPorCategoria.polizas}
          />
        </TabsContent>
      </Tabs>

      {/* Resumen de estado */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Resumen de Documentacion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Vigentes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Por Vencer</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Vencidos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <AlertTriangle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">22</p>
                <p className="text-sm text-muted-foreground">Sin Registrar</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
