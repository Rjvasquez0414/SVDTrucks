'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Eye,
  Trash2,
  Download,
  ExternalLink,
  Receipt,
  Pencil,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getVehiculos } from '@/lib/queries/vehiculos';
import { getDocumentosCompletos, deleteDocumento, getImpuestosDocumentos, createDocumento, updateDocumento } from '@/lib/queries/documentos';
import { supabase } from '@/lib/supabase';
import { useRefetchOnFocus } from '@/hooks/useRefetchOnFocus';
import { VehiculoCompleto, Documento, TipoDocumento, CategoriaDocumento, EstadoDocumento } from '@/types/database';
import { cn } from '@/lib/utils';
import { DocumentoModal } from '@/components/documentos/DocumentoModal';

// Tipos de documentos por categoria
const documentosPorCategoria: Record<CategoriaDocumento, { tipo: TipoDocumento; nombre: string }[]> = {
  cabezote: [
    { tipo: 'soat', nombre: 'SOAT' },
    { tipo: 'poliza_rc_hidrocarburos', nombre: 'Poliza RC Hidrocarburos' },
    { tipo: 'revision_tecnomecanica', nombre: 'Revision Tecnomecanica' },
    { tipo: 'impuestos', nombre: 'Impuestos' },
  ],
  tanque: [
    { tipo: 'prueba_hidrostatica', nombre: 'Prueba Hidrostatica' },
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
  ],
};

// Calcular estado del documento basado en fecha de vencimiento
function calcularEstadoDocumento(fechaVencimiento: string | null): EstadoDocumento {
  if (!fechaVencimiento) return 'vigente'; // Sin fecha = vigente indefinido

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const vencimiento = new Date(fechaVencimiento);
  vencimiento.setHours(0, 0, 0, 0);

  const diasRestantes = Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) return 'vencido';
  if (diasRestantes <= 30) return 'por_vencer';
  return 'vigente';
}

// Componente para mostrar un documento
function DocumentoCard({
  nombre,
  tipo: _tipo,
  fechaVencimiento,
  estado,
  documento,
  onAgregar,
  onEliminar,
  onPrevisualizar,
}: {
  nombre: string;
  tipo: TipoDocumento;
  fechaVencimiento?: string | null;
  estado: EstadoDocumento;
  documento?: Documento | null;
  onAgregar: () => void;
  onEliminar?: () => void;
  onPrevisualizar?: () => void;
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

  const tieneArchivo = documento?.archivo_url;

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
          {documento?.archivo_nombre && (
            <p className="text-xs text-muted-foreground">
              PDF: {documento.archivo_nombre}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {estado === 'sin_registrar' ? (
          <Button size="sm" variant="outline" onClick={onAgregar}>
            <Plus className="h-4 w-4 mr-1" />
            Agregar
          </Button>
        ) : (
          <>
            <Badge className={cn('gap-1', config.color)} variant="outline">
              <Icon className="h-3 w-3" />
              {config.label}
            </Badge>
            {tieneArchivo && onPrevisualizar && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onPrevisualizar}
                title="Ver documento"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onEliminar && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onEliminar}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Eliminar documento"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Componente para una categoria de documentos
function CategoriaDocumentos({
  titulo,
  icon: IconComponent,
  tiposDocumentos,
  documentosRegistrados,
  entidadNombre,
  onAgregarDocumento,
  onEliminarDocumento,
  onPrevisualizarDocumento,
}: {
  titulo: string;
  icon: typeof Truck;
  tiposDocumentos: { tipo: TipoDocumento; nombre: string }[];
  documentosRegistrados: Documento[];
  entidadNombre?: string;
  onAgregarDocumento: (tipo: TipoDocumento) => void;
  onEliminarDocumento: (documento: Documento) => void;
  onPrevisualizarDocumento: (documento: Documento) => void;
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
        {tiposDocumentos.map((tipoDoc) => {
          // Buscar si existe el documento registrado
          const docRegistrado = documentosRegistrados.find(d => d.tipo === tipoDoc.tipo);
          const estado: EstadoDocumento = docRegistrado
            ? calcularEstadoDocumento(docRegistrado.fecha_vencimiento)
            : 'sin_registrar';

          return (
            <DocumentoCard
              key={tipoDoc.tipo}
              nombre={tipoDoc.nombre}
              tipo={tipoDoc.tipo}
              fechaVencimiento={docRegistrado?.fecha_vencimiento}
              estado={estado}
              documento={docRegistrado}
              onAgregar={() => onAgregarDocumento(tipoDoc.tipo)}
              onEliminar={docRegistrado ? () => onEliminarDocumento(docRegistrado) : undefined}
              onPrevisualizar={docRegistrado?.archivo_url ? () => onPrevisualizarDocumento(docRegistrado) : undefined}
            />
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function DocumentacionPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoCompleto[]>([]);
  const [selectedVehiculo, setSelectedVehiculo] = useState<string>('');
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategoria, setModalCategoria] = useState<CategoriaDocumento>('cabezote');
  const [modalTipoPreseleccionado, setModalTipoPreseleccionado] = useState<TipoDocumento | undefined>();

  // Estado para eliminar documento
  const [documentoAEliminar, setDocumentoAEliminar] = useState<Documento | null>(null);
  const [eliminando, setEliminando] = useState(false);

  // Estado para previsualizar documento
  const [documentoPreview, setDocumentoPreview] = useState<Documento | null>(null);

  // Estado para la seccion de Impuestos
  const [impuestosDocs, setImpuestosDocs] = useState<Documento[]>([]);
  const [loadingImpuestos, setLoadingImpuestos] = useState(false);
  const [impuestoEditVehiculo, setImpuestoEditVehiculo] = useState<VehiculoCompleto | null>(null);
  const [impuestoEditDoc, setImpuestoEditDoc] = useState<Documento | null>(null);
  const [impuestoForm, setImpuestoForm] = useState({ jurisdiccion: '', vencimientoPlazo: '', fechaPago: '', mora: '' });
  const [savingImpuesto, setSavingImpuesto] = useState(false);
  const [impuestoError, setImpuestoError] = useState<string | null>(null);

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === selectedVehiculo);

  // Cargar documentos del vehiculo seleccionado
  const cargarDocumentos = useCallback(async () => {
    if (!vehiculoSeleccionado) return;

    setLoadingDocs(true);
    try {
      const docs = await getDocumentosCompletos(
        vehiculoSeleccionado.id,
        vehiculoSeleccionado.remolque_id,
        vehiculoSeleccionado.conductor_id
      );
      setDocumentos(docs);
    } catch (error) {
      console.error('Error cargando documentos:', error);
    } finally {
      setLoadingDocs(false);
    }
  }, [vehiculoSeleccionado]);

  // Recargar todos los datos (vehiculos + documentos del seleccionado)
  const reloadAll = useCallback(async () => {
    try {
      const data = await getVehiculos();
      setVehiculos(data);
      // Recargar documentos del vehiculo actualmente seleccionado
      if (selectedVehiculo) {
        const veh = data.find(v => v.id === selectedVehiculo);
        if (veh) {
          const docs = await getDocumentosCompletos(veh.id, veh.remolque_id, veh.conductor_id);
          setDocumentos(docs);
        }
      }
    } catch (error) {
      console.error('Error recargando datos:', error);
    }
  }, [selectedVehiculo]);

  // Cargar impuestos de todos los vehiculos
  const cargarImpuestos = useCallback(async () => {
    setLoadingImpuestos(true);
    try {
      const docs = await getImpuestosDocumentos();
      setImpuestosDocs(docs);
    } catch (error) {
      console.error('Error cargando impuestos:', error);
    } finally {
      setLoadingImpuestos(false);
    }
  }, []);

  // Abrir modal editar impuesto
  const handleEditImpuesto = (vehiculo: VehiculoCompleto) => {
    const doc = impuestosDocs.find(d => d.vehiculo_id === vehiculo.id);
    setImpuestoEditVehiculo(vehiculo);
    setImpuestoEditDoc(doc || null);
    setImpuestoForm({
      jurisdiccion: doc?.entidad_emisora || vehiculo.lugar_matricula || '',
      vencimientoPlazo: doc?.fecha_vencimiento || '',
      fechaPago: doc?.fecha_emision || '',
      mora: doc?.notas || '',
    });
    setImpuestoError(null);
  };

  // Guardar impuesto
  const handleSaveImpuesto = async () => {
    if (!impuestoEditVehiculo) return;
    setSavingImpuesto(true);
    setImpuestoError(null);
    try {
      if (impuestoEditDoc) {
        await updateDocumento(impuestoEditDoc.id, {
          entidad_emisora: impuestoForm.jurisdiccion || null,
          fecha_vencimiento: impuestoForm.vencimientoPlazo || null,
          fecha_emision: impuestoForm.fechaPago || null,
          notas: impuestoForm.mora || null,
        });
      } else {
        await createDocumento({
          tipo: 'impuestos',
          categoria: 'cabezote',
          nombre: 'Impuestos',
          vehiculo_id: impuestoEditVehiculo.id,
          entidad_emisora: impuestoForm.jurisdiccion || null,
          fecha_vencimiento: impuestoForm.vencimientoPlazo || null,
          fecha_emision: impuestoForm.fechaPago || null,
          notas: impuestoForm.mora || null,
        });
      }
      setImpuestoEditVehiculo(null);
      await cargarImpuestos();
    } catch (error) {
      console.error('Error guardando impuesto:', error);
      setImpuestoError(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      setSavingImpuesto(false);
    }
  };

  // Cargar vehiculos al inicio
  useEffect(() => {
    async function loadData() {
      try {
        const data = await getVehiculos();
        setVehiculos(data);
        if (data.length > 0) {
          setSelectedVehiculo(data[0].id);
        }
      } catch (err) {
        console.error('[Documentacion] Error cargando vehiculos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Cargar documentos cuando cambia el vehiculo seleccionado
  useEffect(() => {
    if (vehiculoSeleccionado) {
      cargarDocumentos();
    }
  }, [vehiculoSeleccionado, cargarDocumentos]);

  // Cargar impuestos cuando se cargan los vehiculos
  useEffect(() => {
    if (vehiculos.length > 0) {
      cargarImpuestos();
    }
  }, [vehiculos.length, cargarImpuestos]);

  // Recargar cuando el usuario vuelve a la pestaña (si estuvo inactiva >1 min)
  useRefetchOnFocus(reloadAll, 60_000);

  // Filtrar documentos por categoria
  const getDocumentosPorCategoria = (categoria: CategoriaDocumento): Documento[] => {
    return documentos.filter(d => d.categoria === categoria);
  };

  // Abrir modal para agregar documento
  const handleAgregarDocumento = (categoria: CategoriaDocumento, tipo?: TipoDocumento) => {
    setModalCategoria(categoria);
    setModalTipoPreseleccionado(tipo);
    setModalOpen(true);
  };

  // Eliminar documento
  const handleEliminarDocumento = async () => {
    if (!documentoAEliminar) return;

    setEliminando(true);
    try {
      // Si tiene archivo en storage, eliminarlo tambien
      if (documentoAEliminar.archivo_url) {
        // Extraer el path del archivo de la URL
        const urlParts = documentoAEliminar.archivo_url.split('/documentos/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('documentos').remove([filePath]);
        }
      }

      // Eliminar el registro de la base de datos
      await deleteDocumento(documentoAEliminar.id);

      // Recargar documentos
      await cargarDocumentos();
      setDocumentoAEliminar(null);
    } catch (error) {
      console.error('Error eliminando documento:', error);
    } finally {
      setEliminando(false);
    }
  };

  // Previsualizar documento
  const handlePrevisualizarDocumento = (documento: Documento) => {
    if (documento.archivo_url) {
      setDocumentoPreview(documento);
    }
  };

  // Calcular resumen de estados
  const calcularResumen = () => {
    let vigentes = 0;
    let porVencer = 0;
    let vencidos = 0;
    let sinRegistrar = 0;

    // Contar todos los tipos de documentos posibles
    const todasCategorias: CategoriaDocumento[] = ['cabezote', 'tanque', 'conductor', 'polizas'];

    todasCategorias.forEach(categoria => {
      const tiposEnCategoria = documentosPorCategoria[categoria];
      tiposEnCategoria.forEach(tipoDoc => {
        const docRegistrado = documentos.find(d => d.tipo === tipoDoc.tipo);
        if (!docRegistrado) {
          sinRegistrar++;
        } else {
          const estado = calcularEstadoDocumento(docRegistrado.fecha_vencimiento);
          if (estado === 'vigente') vigentes++;
          else if (estado === 'por_vencer') porVencer++;
          else if (estado === 'vencido') vencidos++;
        }
      });
    });

    return { vigentes, porVencer, vencidos, sinRegistrar };
  };

  const resumen = calcularResumen();

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
          <Button onClick={() => handleAgregarDocumento('cabezote')}>
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
                  {vehiculoSeleccionado.lugar_matricula && (
                    <p className="text-xs text-muted-foreground">
                      Matriculado en: {vehiculoSeleccionado.lugar_matricula}
                    </p>
                  )}
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

              {loadingDocs && (
                <div className="flex items-center gap-2 ml-auto">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Cargando documentos...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de categorias */}
      <Tabs defaultValue="cabezote" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="impuestos" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Impuestos</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cabezote">
          <CategoriaDocumentos
            titulo="Documentos del Cabezote"
            icon={Truck}
            tiposDocumentos={documentosPorCategoria.cabezote}
            documentosRegistrados={getDocumentosPorCategoria('cabezote')}
            entidadNombre={vehiculoSeleccionado?.placa}
            onAgregarDocumento={(tipo) => handleAgregarDocumento('cabezote', tipo)}
            onEliminarDocumento={(doc) => setDocumentoAEliminar(doc)}
            onPrevisualizarDocumento={handlePrevisualizarDocumento}
          />
        </TabsContent>

        <TabsContent value="tanque">
          <CategoriaDocumentos
            titulo="Documentos del Tanque"
            icon={Container}
            tiposDocumentos={documentosPorCategoria.tanque}
            documentosRegistrados={getDocumentosPorCategoria('tanque')}
            entidadNombre={vehiculoSeleccionado?.remolques?.placa || 'Sin asignar'}
            onAgregarDocumento={(tipo) => handleAgregarDocumento('tanque', tipo)}
            onEliminarDocumento={(doc) => setDocumentoAEliminar(doc)}
            onPrevisualizarDocumento={handlePrevisualizarDocumento}
          />
        </TabsContent>

        <TabsContent value="conductor">
          <CategoriaDocumentos
            titulo="Documentos del Conductor"
            icon={User}
            tiposDocumentos={documentosPorCategoria.conductor}
            documentosRegistrados={getDocumentosPorCategoria('conductor')}
            entidadNombre={vehiculoSeleccionado?.conductores?.nombre || 'Sin asignar'}
            onAgregarDocumento={(tipo) => handleAgregarDocumento('conductor', tipo)}
            onEliminarDocumento={(doc) => setDocumentoAEliminar(doc)}
            onPrevisualizarDocumento={handlePrevisualizarDocumento}
          />
        </TabsContent>

        <TabsContent value="polizas">
          <CategoriaDocumentos
            titulo="Polizas de Seguros"
            icon={Shield}
            tiposDocumentos={documentosPorCategoria.polizas}
            documentosRegistrados={getDocumentosPorCategoria('polizas')}
            onAgregarDocumento={(tipo) => handleAgregarDocumento('polizas', tipo)}
            onEliminarDocumento={(doc) => setDocumentoAEliminar(doc)}
            onPrevisualizarDocumento={handlePrevisualizarDocumento}
          />
        </TabsContent>

        <TabsContent value="impuestos">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Impuesto de Vehiculos
                </CardTitle>
                <Badge variant="secondary">Se renueva anualmente</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loadingImpuestos ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">No.</TableHead>
                        <TableHead>Placa Cabezote</TableHead>
                        <TableHead>Jurisdiccion</TableHead>
                        <TableHead>Vencimiento del Plazo para Declarar</TableHead>
                        <TableHead>Fecha de Pago</TableHead>
                        <TableHead>Mora</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehiculos.map((v, idx) => {
                        const doc = impuestosDocs.find(d => d.vehiculo_id === v.id);
                        const estado = doc
                          ? calcularEstadoDocumento(doc.fecha_vencimiento)
                          : 'sin_registrar';
                        const estadoConfig = {
                          vigente: { label: 'Vigente', color: 'text-green-600 bg-green-100', icon: CheckCircle },
                          por_vencer: { label: 'Por Vencer', color: 'text-yellow-600 bg-yellow-100', icon: Clock },
                          vencido: { label: 'Vencido', color: 'text-red-600 bg-red-100', icon: XCircle },
                          sin_registrar: { label: 'Sin Registrar', color: 'text-gray-600 bg-gray-100', icon: AlertTriangle },
                        };
                        const config = estadoConfig[estado];
                        const EstadoIcon = config.icon;

                        const formatFecha = (f: string | null | undefined) => {
                          if (!f) return '\u2014';
                          return new Date(f).toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          });
                        };

                        return (
                          <TableRow key={v.id}>
                            <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-medium">{v.placa}</TableCell>
                            <TableCell>{doc?.entidad_emisora || v.lugar_matricula || '\u2014'}</TableCell>
                            <TableCell>{formatFecha(doc?.fecha_vencimiento)}</TableCell>
                            <TableCell>{formatFecha(doc?.fecha_emision)}</TableCell>
                            <TableCell>{doc?.notas || '\u2014'}</TableCell>
                            <TableCell>
                              <Badge className={cn('gap-1', config.color)} variant="outline">
                                <EstadoIcon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditImpuesto(v)}
                                title={doc ? 'Editar impuesto' : 'Agregar impuesto'}
                              >
                                {doc ? (
                                  <Pencil className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-muted-foreground mt-4 italic">
                    * Los tanques no pagan impuestos. Esta informacion se renueva anualmente.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
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
                <p className="text-2xl font-bold">{resumen.vigentes}</p>
                <p className="text-sm text-muted-foreground">Vigentes</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen.porVencer}</p>
                <p className="text-sm text-muted-foreground">Por Vencer</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen.vencidos}</p>
                <p className="text-sm text-muted-foreground">Vencidos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <AlertTriangle className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{resumen.sinRegistrar}</p>
                <p className="text-sm text-muted-foreground">Sin Registrar</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para agregar documento */}
      {vehiculoSeleccionado && (
        <DocumentoModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          categoria={modalCategoria}
          vehiculoId={vehiculoSeleccionado.id}
          remolqueId={vehiculoSeleccionado.remolque_id}
          conductorId={vehiculoSeleccionado.conductor_id}
          onSuccess={cargarDocumentos}
          tipoPreseleccionado={modalTipoPreseleccionado}
        />
      )}

      {/* Modal de confirmacion para eliminar */}
      <Dialog open={!!documentoAEliminar} onOpenChange={(open) => !open && setDocumentoAEliminar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Documento</DialogTitle>
            <DialogDescription>
              Estas seguro de que deseas eliminar el documento &quot;{documentoAEliminar?.nombre}&quot;?
              Esta accion no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDocumentoAEliminar(null)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleEliminarDocumento}
              disabled={eliminando}
            >
              {eliminando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para editar/agregar impuesto */}
      <Dialog open={!!impuestoEditVehiculo} onOpenChange={(open) => !open && setImpuestoEditVehiculo(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Impuesto - {impuestoEditVehiculo?.placa}
            </DialogTitle>
            <DialogDescription>
              {impuestoEditDoc ? 'Editar informacion del impuesto vehicular' : 'Registrar informacion del impuesto vehicular'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {impuestoError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {impuestoError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="imp-jurisdiccion">Jurisdiccion</Label>
              <Input
                id="imp-jurisdiccion"
                value={impuestoForm.jurisdiccion}
                onChange={(e) => setImpuestoForm(prev => ({ ...prev, jurisdiccion: e.target.value }))}
                placeholder="Ej: Floridablanca, Bucaramanga"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imp-vencimiento">Vencimiento del Plazo para Declarar</Label>
              <Input
                id="imp-vencimiento"
                type="date"
                value={impuestoForm.vencimientoPlazo}
                onChange={(e) => setImpuestoForm(prev => ({ ...prev, vencimientoPlazo: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                El sistema te alertara cuando este proximo a vencer
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imp-fecha-pago">Fecha de Pago</Label>
              <Input
                id="imp-fecha-pago"
                type="date"
                value={impuestoForm.fechaPago}
                onChange={(e) => setImpuestoForm(prev => ({ ...prev, fechaPago: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imp-mora">Mora</Label>
              <Input
                id="imp-mora"
                value={impuestoForm.mora}
                onChange={(e) => setImpuestoForm(prev => ({ ...prev, mora: e.target.value }))}
                placeholder="Ej: Sin mora, $50.000, etc."
              />
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setImpuestoEditVehiculo(null)}
              disabled={savingImpuesto}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveImpuesto} disabled={savingImpuesto}>
              {savingImpuesto ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de previsualizacion de PDF mejorado */}
      <Dialog open={!!documentoPreview} onOpenChange={(open) => !open && setDocumentoPreview(null)}>
        <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {documentoPreview?.nombre}
            </DialogTitle>
            <DialogDescription className="flex items-center justify-between">
              <span>{documentoPreview?.archivo_nombre}</span>
              {documentoPreview?.archivo_url && (
                <a
                  href={documentoPreview.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Download className="h-3 w-3" />
                  Descargar PDF
                </a>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 mt-4 rounded-lg overflow-hidden border bg-muted">
            {documentoPreview?.archivo_url ? (
              <object
                data={documentoPreview.archivo_url}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No se puede mostrar el PDF en el navegador
                  </p>
                  <a
                    href={documentoPreview.archivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Abrir en nueva pestaña
                  </a>
                </div>
              </object>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No hay archivo PDF disponible
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
