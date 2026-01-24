'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  RefreshCw,
  Wrench,
  Gauge,
} from 'lucide-react';
import {
  getAlertasPendientes,
  contarAlertasPorPrioridad,
  marcarAlertaAtendida,
  descartarAlerta,
  generarTodasLasAlertas,
  type AlertaConVehiculo,
} from '@/lib/queries/alertas';
import { useAuth } from '@/lib/auth-context';
import type { TipoAlerta, PrioridadAlerta } from '@/types/database';
import { cn, formatNumber } from '@/lib/utils';
import Link from 'next/link';

const iconosPorTipo: Record<TipoAlerta, typeof AlertTriangle> = {
  mantenimiento_kilometraje: Wrench,
  mantenimiento_tiempo: Clock,
  vencimiento_documento: FileWarning,
  documento_vencido: AlertTriangle,
  vehiculo_inactivo: Truck,
  kilometraje_alto: Truck,
  mantenimiento_pendiente: AlertTriangle,
  actualizar_kilometraje: Gauge,
};

const nombresTipo: Record<TipoAlerta, string> = {
  mantenimiento_kilometraje: 'Mantenimiento por Kilometraje',
  mantenimiento_tiempo: 'Mantenimiento por Tiempo',
  vencimiento_documento: 'Documento por Vencer',
  documento_vencido: 'Documento Vencido',
  vehiculo_inactivo: 'Vehiculo Inactivo',
  kilometraje_alto: 'Kilometraje Alto',
  mantenimiento_pendiente: 'Mantenimiento Pendiente',
  actualizar_kilometraje: 'Actualizar Kilometraje',
};

const coloresPorPrioridad: Record<PrioridadAlerta, string> = {
  alta: 'border-l-red-500 bg-red-50',
  media: 'border-l-yellow-500 bg-yellow-50',
  baja: 'border-l-blue-500 bg-blue-50',
};

export default function AlertasPage() {
  const { usuario } = useAuth();
  const [alertas, setAlertas] = useState<AlertaConVehiculo[]>([]);
  const [conteo, setConteo] = useState({ alta: 0, media: 0, baja: 0 });
  const [loading, setLoading] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [mensajeGeneracion, setMensajeGeneracion] = useState<string | null>(null);

  // Cargar alertas
  const cargarAlertas = useCallback(async () => {
    const [alertasData, conteoData] = await Promise.all([
      getAlertasPendientes(),
      contarAlertasPorPrioridad(),
    ]);
    setAlertas(alertasData);
    setConteo(conteoData);
    setLoading(false);
  }, []);

  // Generar alertas automaticamente al cargar la pagina
  useEffect(() => {
    async function initAlertas() {
      setLoading(true);
      setMensajeGeneracion('Verificando alertas...');
      try {
        // Generar alertas automaticamente
        const resultado = await generarTodasLasAlertas();

        // Mostrar resultado solo si se generaron nuevas alertas
        if (resultado.total > 0) {
          const partes = [];
          if (resultado.mantenimientosKm > 0) partes.push(`${resultado.mantenimientosKm} por km`);
          if (resultado.mantenimientosTiempo > 0) partes.push(`${resultado.mantenimientosTiempo} por tiempo`);
          if (resultado.documentos > 0) partes.push(`${resultado.documentos} documentos`);
          if (resultado.kilometraje > 0) partes.push(`${resultado.kilometraje} actualizar km`);
          setMensajeGeneracion(`Se generaron ${resultado.total} nuevas alertas: ${partes.join(', ')}`);
          setTimeout(() => setMensajeGeneracion(null), 5000);
        } else {
          setMensajeGeneracion(null);
        }
      } catch (error) {
        console.error('Error generando alertas:', error);
        setMensajeGeneracion(null);
      }

      // Cargar las alertas
      await cargarAlertas();
    }
    initAlertas();
  }, [cargarAlertas]);

  // Generar nuevas alertas
  const handleGenerarAlertas = async () => {
    setGenerando(true);
    setMensajeGeneracion(null);
    try {
      const resultado = await generarTodasLasAlertas();
      console.log('Alertas generadas:', resultado);
      await cargarAlertas();

      // Mostrar resultado
      if (resultado.total > 0) {
        const partes = [];
        if (resultado.mantenimientosKm > 0) partes.push(`${resultado.mantenimientosKm} por km`);
        if (resultado.mantenimientosTiempo > 0) partes.push(`${resultado.mantenimientosTiempo} por tiempo`);
        if (resultado.documentos > 0) partes.push(`${resultado.documentos} documentos`);
        if (resultado.kilometraje > 0) partes.push(`${resultado.kilometraje} actualizar km`);

        setMensajeGeneracion(`Se generaron ${resultado.total} nuevas alertas: ${partes.join(', ')}`);
      } else {
        setMensajeGeneracion('Sistema al dia - no se generaron nuevas alertas');
      }

      // Ocultar mensaje despues de 5 segundos
      setTimeout(() => setMensajeGeneracion(null), 5000);
    } catch (error) {
      console.error('Error generando alertas:', error);
      setMensajeGeneracion('Error al generar alertas');
    } finally {
      setGenerando(false);
    }
  };

  // Marcar como atendida
  const handleMarcarAtendida = async (id: string) => {
    setProcesando(id);
    const exito = await marcarAlertaAtendida(id, usuario?.id);
    if (exito) {
      setAlertas(alertas.filter((a) => a.id !== id));
      setConteo(prev => {
        const alerta = alertas.find(a => a.id === id);
        if (!alerta) return prev;
        return {
          ...prev,
          [alerta.prioridad]: Math.max(0, prev[alerta.prioridad] - 1),
        };
      });
    }
    setProcesando(null);
  };

  // Descartar alerta
  const handleDescartar = async (id: string) => {
    setProcesando(id);
    const exito = await descartarAlerta(id);
    if (exito) {
      setAlertas(alertas.filter((a) => a.id !== id));
      setConteo(prev => {
        const alerta = alertas.find(a => a.id === id);
        if (!alerta) return prev;
        return {
          ...prev,
          [alerta.prioridad]: Math.max(0, prev[alerta.prioridad] - 1),
        };
      });
    }
    setProcesando(null);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const AlertaCard = ({ alerta }: { alerta: AlertaConVehiculo }) => {
    const Icono = iconosPorTipo[alerta.tipo] || AlertTriangle;
    const isProcesando = procesando === alerta.id;

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

          {alerta.vehiculos && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>
                {alerta.vehiculos.placa} - {alerta.vehiculos.marca} {alerta.vehiculos.modelo}
              </span>
            </div>
          )}

          {alerta.kilometraje_actual && alerta.kilometraje_limite && (
            <p className="text-sm text-muted-foreground">
              Kilometraje actual: {formatNumber(alerta.kilometraje_actual)} km /
              Limite: {formatNumber(alerta.kilometraje_limite)} km
            </p>
          )}

          {alerta.fecha_limite && (
            <p className="text-sm text-muted-foreground">
              Fecha limite: {formatearFecha(alerta.fecha_limite)}
            </p>
          )}

          <div className="flex items-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground">
              Generada: {formatearFecha(alerta.fecha_generada)}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {alerta.vehiculos && (
              <Link href={`/vehiculos/${alerta.vehiculo_id}`}>
                <Button variant="outline" size="sm" disabled={isProcesando}>
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Vehiculo
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMarcarAtendida(alerta.id)}
              disabled={isProcesando}
            >
              {isProcesando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Marcar Atendida
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDescartar(alerta.id)}
              disabled={isProcesando}
            >
              <X className="h-4 w-4 mr-1" />
              Descartar
            </Button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout title="Centro de Alertas">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Centro de Alertas">
      {/* Header con boton de generar */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Alertas activas de mantenimientos y documentos
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleGenerarAlertas}
            disabled={generando}
          >
            {generando ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar Alertas
              </>
            )}
          </Button>
        </div>

        {/* Mensaje de resultado de generacion */}
        {mensajeGeneracion && (
          <div className={cn(
            "p-3 rounded-lg text-sm",
            mensajeGeneracion.includes('Error')
              ? "bg-red-50 text-red-700 border border-red-200"
              : mensajeGeneracion.includes('generaron')
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
          )}>
            {mensajeGeneracion}
          </div>
        )}
      </div>

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
            Alertas Pendientes ({alertas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="todas">
            <TabsList>
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="alta">
                Alta ({alertas.filter((a) => a.prioridad === 'alta').length})
              </TabsTrigger>
              <TabsTrigger value="media">
                Media ({alertas.filter((a) => a.prioridad === 'media').length})
              </TabsTrigger>
              <TabsTrigger value="baja">
                Baja ({alertas.filter((a) => a.prioridad === 'baja').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="todas" className="mt-4">
              <div className="space-y-4">
                {alertas.map((alerta) => (
                  <AlertaCard key={alerta.id} alerta={alerta} />
                ))}
                {alertas.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <h3 className="mt-4 text-lg font-semibold">Todo en orden</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      No hay alertas pendientes por atender
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={handleGenerarAlertas}
                      disabled={generando}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Verificar nuevas alertas
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="alta" className="mt-4">
              <div className="space-y-4">
                {alertas
                  .filter((a) => a.prioridad === 'alta')
                  .map((alerta) => (
                    <AlertaCard key={alerta.id} alerta={alerta} />
                  ))}
                {alertas.filter((a) => a.prioridad === 'alta').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay alertas de prioridad alta
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="media" className="mt-4">
              <div className="space-y-4">
                {alertas
                  .filter((a) => a.prioridad === 'media')
                  .map((alerta) => (
                    <AlertaCard key={alerta.id} alerta={alerta} />
                  ))}
                {alertas.filter((a) => a.prioridad === 'media').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay alertas de prioridad media
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="baja" className="mt-4">
              <div className="space-y-4">
                {alertas
                  .filter((a) => a.prioridad === 'baja')
                  .map((alerta) => (
                    <AlertaCard key={alerta.id} alerta={alerta} />
                  ))}
                {alertas.filter((a) => a.prioridad === 'baja').length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No hay alertas de prioridad baja
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
