'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { getVehiculos } from '@/lib/queries/vehiculos';
import {
  catalogoMantenimiento,
  getCategoriaInfo,
  calcularProximoKm,
  calcularProximaFecha,
} from '@/data/tipos-mantenimiento';
import {
  getMantenimientoById,
  getRepuestosByMantenimiento,
  updateMantenimiento,
  deleteRepuestosByMantenimiento,
  createRepuestos,
  actualizarKilometrajeVehiculo,
} from '@/lib/queries/mantenimientos';
import { ArrowLeft, Save, Plus, X, Loader2, Info, ImagePlus, Trash2, FileText } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { VehiculoCompleto, CategoriaMantenimiento, TipoMantenimiento } from '@/types/database';

interface RepuestoForm {
  nombre: string;
  cantidad: number | string;
  costoTotal: number | string;
}

// Archivo que puede ser nuevo (File) o existente (URL string)
interface ArchivoEvidencia {
  tipo: 'nuevo' | 'existente';
  file?: File;
  url: string;
  esPdf: boolean;
  nombre: string;
}

function esPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf');
}

export default function EditarMantenimientoPage() {
  const router = useRouter();
  const params = useParams();
  const mantenimientoId = params.id as string;
  const { usuario } = useAuth();

  // Estados del formulario
  const [vehiculoId, setVehiculoId] = useState('');
  const [tipo, setTipo] = useState<TipoMantenimiento>('preventivo');
  const [categoria, setCategoria] = useState<CategoriaMantenimiento | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState('');
  const [kilometraje, setKilometraje] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [repuestos, setRepuestos] = useState<RepuestoForm[]>([]);
  const [archivos, setArchivos] = useState<ArchivoEvidencia[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Estados de carga
  const [vehiculos, setVehiculos] = useState<VehiculoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [mantenimiento, repuestosData, vehsData] = await Promise.all([
        getMantenimientoById(mantenimientoId),
        getRepuestosByMantenimiento(mantenimientoId),
        getVehiculos(),
      ]);

      if (!mantenimiento) {
        setError('Mantenimiento no encontrado');
        setLoading(false);
        return;
      }

      setVehiculos(vehsData);
      setVehiculoId(mantenimiento.vehiculo_id);
      setTipo(mantenimiento.tipo);
      setCategoria(mantenimiento.categoria);
      setDescripcion(mantenimiento.descripcion);
      setFecha(mantenimiento.fecha);
      setKilometraje(mantenimiento.kilometraje.toString());
      setProveedor(mantenimiento.proveedor || '');
      setObservaciones(mantenimiento.observaciones || '');

      // Cargar repuestos existentes
      if (repuestosData.length > 0) {
        setRepuestos(
          repuestosData.map((r) => ({
            nombre: r.nombre,
            cantidad: r.cantidad,
            costoTotal: r.costo_total != null && Number(r.costo_total) > 0
              ? Number(r.costo_total)
              : Number(r.costo_unitario) * Number(r.cantidad),
          }))
        );
      }

      // Cargar archivos existentes (imagenes y PDFs)
      if (mantenimiento.imagenes && mantenimiento.imagenes.length > 0) {
        setArchivos(
          mantenimiento.imagenes.map((url) => ({
            tipo: 'existente' as const,
            url,
            esPdf: esPdfUrl(url),
            nombre: url.split('/').pop() || 'archivo',
          }))
        );
      }
    } catch (err) {
      console.error('Error cargando mantenimiento:', err);
      setError('Error al cargar el mantenimiento');
    } finally {
      setLoading(false);
    }
  }, [mantenimientoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === vehiculoId);
  const categoriasFiltradas = catalogoMantenimiento.filter((c) => c.tipo === tipo);
  const categoriaInfo = categoria ? getCategoriaInfo(categoria) : null;

  // Repuestos
  const agregarInsumosTipicos = () => {
    if (categoriaInfo?.insumosTipicos) {
      const nuevosRepuestos = categoriaInfo.insumosTipicos.map((insumo) => ({
        nombre: insumo,
        cantidad: 1,
        costoTotal: '',
      }));
      setRepuestos([...repuestos, ...nuevosRepuestos]);
    }
  };

  const agregarRepuesto = () => {
    setRepuestos([...repuestos, { nombre: '', cantidad: 1, costoTotal: '' }]);
  };

  const actualizarRepuesto = (index: number, field: keyof RepuestoForm, value: string | number) => {
    const nuevosRepuestos = [...repuestos];
    nuevosRepuestos[index] = { ...nuevosRepuestos[index], [field]: value };
    setRepuestos(nuevosRepuestos);
  };

  const eliminarRepuesto = (index: number) => {
    setRepuestos(repuestos.filter((_, i) => i !== index));
  };

  const costoRepuestos = repuestos.reduce((sum, r) => sum + (Number(r.costoTotal) || 0), 0);

  // Navegación de teclado en repuestos (Enter, flechas)
  const handleRepuestoKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    const totalRows = repuestos.length;
    const maxCol = 2;

    const focusCell = (r: number, c: number) => {
      const target = document.querySelector<HTMLInputElement>(
        `[data-repuesto-row="${r}"][data-repuesto-col="${c}"]`
      );
      if (target) {
        target.focus();
        const len = target.value.length;
        target.setSelectionRange(len, len);
      }
    };

    if (e.key === 'Enter') {
      e.preventDefault();
      if (col < maxCol) {
        focusCell(row, col + 1);
      } else if (row < totalRows - 1) {
        focusCell(row + 1, 0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (row < totalRows - 1) focusCell(row + 1, col);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (row > 0) focusCell(row - 1, col);
      return;
    }

    const input = e.currentTarget;
    if (e.key === 'ArrowRight' && input.selectionStart === input.value.length) {
      e.preventDefault();
      if (col < maxCol) focusCell(row, col + 1);
      else if (row < totalRows - 1) focusCell(row + 1, 0);
      return;
    }

    if (e.key === 'ArrowLeft' && input.selectionStart === 0) {
      e.preventDefault();
      if (col > 0) focusCell(row, col - 1);
      else if (row > 0) focusCell(row - 1, maxCol);
      return;
    }
  }, [repuestos.length]);

  // Drag & drop para evidencia
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith('image/') || f.type === 'application/pdf'
    );
    if (files.length === 0) return;
    const nuevosArchivos: ArchivoEvidencia[] = files.map((file) => ({
      tipo: 'nuevo' as const,
      file,
      url: file.type === 'application/pdf' ? '' : URL.createObjectURL(file),
      esPdf: file.type === 'application/pdf',
      nombre: file.name,
    }));
    const totalArchivos = [...archivos, ...nuevosArchivos].slice(0, 5);
    setArchivos(totalArchivos);
  }, [archivos]);

  // Archivos (imagenes + PDFs)
  const agregarArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const nuevosArchivos: ArchivoEvidencia[] = files.map((file) => ({
      tipo: 'nuevo' as const,
      file,
      url: file.type === 'application/pdf' ? '' : URL.createObjectURL(file),
      esPdf: file.type === 'application/pdf',
      nombre: file.name,
    }));

    const totalArchivos = [...archivos, ...nuevosArchivos].slice(0, 5);
    setArchivos(totalArchivos);

    // Reset input
    e.target.value = '';
  };

  const eliminarArchivo = (index: number) => {
    const archivo = archivos[index];
    if (archivo.tipo === 'nuevo' && !archivo.esPdf) {
      URL.revokeObjectURL(archivo.url);
    }
    setArchivos(archivos.filter((_, i) => i !== index));
  };

  const subirArchivos = async (): Promise<string[]> => {
    const urls: string[] = [];
    const errores: string[] = [];

    for (const archivo of archivos) {
      if (archivo.tipo === 'existente') {
        urls.push(archivo.url);
        continue;
      }

      if (!archivo.file) continue;

      const fileExt = archivo.file.name.split('.').pop();
      const fileName = `${mantenimientoId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('mantenimientos')
        .upload(fileName, archivo.file);

      if (error) {
        console.error('Error subiendo archivo:', error);
        errores.push(`${archivo.nombre}: ${error.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('mantenimientos')
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
    }

    if (errores.length > 0) {
      setError(`Error subiendo archivos: ${errores.join(', ')}`);
    }

    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!vehiculoId || !categoria || !kilometraje) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setSubmitting(true);

    try {
      const kmActual = parseInt(kilometraje);
      const proximoKm = calcularProximoKm(categoria, kmActual);
      const proximaFecha = calcularProximaFecha(categoria, fecha);

      // 1. Subir archivos nuevos PRIMERO (antes de actualizar el mantenimiento)
      const imageUrls = await subirArchivos();

      // 2. Preparar repuestos ANTES de eliminar los antiguos
      const repuestosParaCrear = repuestos
        .filter((r) => r.nombre.trim())
        .map((r) => {
          const cant = Number(r.cantidad) || 1;
          const total = Number(r.costoTotal) || 0;
          return {
            mantenimiento_id: mantenimientoId,
            nombre: r.nombre,
            cantidad: cant,
            costo_unitario: cant > 0 ? parseFloat((total / cant).toFixed(2)) : total,
            costo_total: total,
          };
        });

      // 3. Reemplazar repuestos: eliminar y recrear inmediatamente
      await deleteRepuestosByMantenimiento(mantenimientoId);
      if (repuestosParaCrear.length > 0) {
        await createRepuestos(repuestosParaCrear);
      }

      // 4. Actualizar mantenimiento (solo si los repuestos se guardaron bien)
      await updateMantenimiento(mantenimientoId, {
        vehiculo_id: vehiculoId,
        tipo,
        categoria,
        descripcion,
        fecha,
        kilometraje: kmActual,
        costo: costoRepuestos,
        proveedor: proveedor || null,
        observaciones: observaciones || null,
        proximo_km: proximoKm,
        proxima_fecha: proximaFecha?.toISOString().split('T')[0] || null,
        imagenes: imageUrls,
      });

      // 5. Actualizar kilometraje del vehiculo si es mayor
      if (vehiculoSeleccionado && kmActual > vehiculoSeleccionado.kilometraje) {
        await actualizarKilometrajeVehiculo(vehiculoId, kmActual);
      }

      router.push('/mantenimientos');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar el mantenimiento');
    } finally {
      setSubmitting(false);
    }
  };

  const formatearPesos = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

  if (loading) {
    return (
      <MainLayout title="Editar Mantenimiento">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  if (error && !vehiculoId) {
    return (
      <MainLayout title="Editar Mantenimiento">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-destructive">{error}</p>
          <Link href="/mantenimientos">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a mantenimientos
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Editar Mantenimiento">
      {/* Back button */}
      <div className="mb-4">
        <Link href="/mantenimientos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a mantenimientos
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main form */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 p-4 text-destructive">
                {error}
              </div>
            )}

            {/* Informacion basica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Informacion Basica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="vehiculo">Vehiculo *</Label>
                    <Select value={vehiculoId} onValueChange={setVehiculoId} required>
                      <SelectTrigger id="vehiculo">
                        <SelectValue placeholder="Seleccionar vehiculo" />
                      </SelectTrigger>
                      <SelectContent>
                        {vehiculos.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.placa} - {v.marca} {v.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Mantenimiento *</Label>
                    <Select
                      value={tipo}
                      onValueChange={(value) => {
                        setTipo(value as TipoMantenimiento);
                        setCategoria('');
                        setDescripcion('');
                      }}
                    >
                      <SelectTrigger id="tipo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventivo">Preventivo</SelectItem>
                        <SelectItem value="correctivo">Correctivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select
                      value={categoria}
                      onValueChange={(value) => {
                        setCategoria(value as CategoriaMantenimiento);
                        setDescripcion('');
                        setRepuestos([]);
                      }}
                      required
                    >
                      <SelectTrigger id="categoria">
                        <SelectValue placeholder="Seleccionar categoria" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {categoriasFiltradas.map((c) => (
                          <SelectItem key={c.categoria} value={c.categoria}>
                            <div className="flex items-center gap-2">
                              <span>{c.nombre}</span>
                              {c.intervaloKm && (
                                <Badge variant="outline" className="text-xs">
                                  {formatNumber(c.intervaloKm)} km
                                </Badge>
                              )}
                              {c.intervaloMeses && (
                                <Badge variant="outline" className="text-xs">
                                  {c.intervaloMeses} meses
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha *</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Info de la categoria seleccionada */}
                {categoriaInfo && categoria !== 'otro' && (
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Info className="h-4 w-4" />
                      {categoriaInfo.nombre}
                    </div>
                    <p className="text-sm text-muted-foreground">{categoriaInfo.descripcion}</p>
                    <div className="flex flex-wrap gap-2">
                      {categoriaInfo.intervaloKm && (
                        <Badge variant="secondary">
                          Intervalo: {formatNumber(categoriaInfo.intervaloKm)} km
                        </Badge>
                      )}
                      {categoriaInfo.intervaloMeses && (
                        <Badge variant="secondary">
                          Intervalo: {categoriaInfo.intervaloMeses} meses
                        </Badge>
                      )}
                      <Badge variant="outline">
                        Aplica a: {categoriaInfo.aplicaA === 'ambos' ? 'Cabezote y Trailer' : categoriaInfo.aplicaA}
                      </Badge>
                    </div>
                  </div>
                )}

                {categoria === 'otro' && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                      <Info className="h-4 w-4" />
                      Mantenimiento Personalizado
                    </div>
                    <p className="text-sm text-orange-600">
                      Especifica el tipo de mantenimiento que deseas registrar.
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="kilometraje">Kilometraje Actual *</Label>
                    <Input
                      id="kilometraje"
                      type="number"
                      placeholder={
                        vehiculoSeleccionado
                          ? `Actual: ${formatNumber(vehiculoSeleccionado.kilometraje)} km`
                          : 'Ej: 150000'
                      }
                      value={kilometraje}
                      onChange={(e) => setKilometraje(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="proveedor">Proveedor / Taller</Label>
                    <Input
                      id="proveedor"
                      placeholder="Nombre del taller"
                      value={proveedor}
                      onChange={(e) => setProveedor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">
                    {categoria === 'otro' ? 'Tipo de Mantenimiento *' : 'Descripcion *'}
                  </Label>
                  <Input
                    id="descripcion"
                    placeholder={
                      categoria === 'otro'
                        ? 'Ej: Cambio de bateria, Reparacion de luces, etc.'
                        : 'Descripcion del trabajo realizado'
                    }
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  />
                  {categoria === 'otro' && (
                    <p className="text-xs text-muted-foreground">
                      Describe claramente que tipo de mantenimiento se realizo
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <textarea
                    id="observaciones"
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Notas adicionales sobre el mantenimiento..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Repuestos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Repuestos e Insumos</CardTitle>
                <div className="flex gap-2">
                  {categoriaInfo?.insumosTipicos && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={agregarInsumosTipicos}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Agregar Insumos Tipicos
                    </Button>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={agregarRepuesto}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {repuestos.length > 0 ? (
                  <div className="space-y-3">
                    {repuestos.map((repuesto, index) => (
                      <div key={index} className="flex items-end gap-3">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Nombre</Label>
                          <Input
                            placeholder="Nombre del repuesto"
                            value={repuesto.nombre}
                            onChange={(e) =>
                              actualizarRepuesto(index, 'nombre', e.target.value)
                            }
                            data-repuesto-row={index}
                            data-repuesto-col={0}
                            onKeyDown={(e) => handleRepuestoKeyDown(e, index, 0)}
                          />
                        </div>
                        <div className="w-20 space-y-1">
                          <Label className="text-xs">Cant.</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={repuesto.cantidad}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              actualizarRepuesto(index, 'cantidad', raw === '' ? '' : parseInt(raw));
                            }}
                            onCopy={(e) => {
                              e.preventDefault();
                              const val = String(repuesto.cantidad);
                              e.clipboardData.setData('text/plain', val ? formatNumber(Number(val)) : '');
                            }}
                            data-repuesto-row={index}
                            data-repuesto-col={1}
                            onKeyDown={(e) => handleRepuestoKeyDown(e, index, 1)}
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <Label className="text-xs">Costo Total</Label>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={repuesto.costoTotal}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              actualizarRepuesto(index, 'costoTotal', raw === '' ? '' : parseInt(raw));
                            }}
                            onCopy={(e) => {
                              e.preventDefault();
                              const val = String(repuesto.costoTotal);
                              e.clipboardData.setData('text/plain', val ? formatNumber(Number(val)) : '');
                            }}
                            data-repuesto-row={index}
                            data-repuesto-col={2}
                            onKeyDown={(e) => handleRepuestoKeyDown(e, index, 2)}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => eliminarRepuesto(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay repuestos agregados
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Evidencia visual (imagenes + PDFs) */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Evidencia Visual</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {archivos.length}/5 archivos
                </span>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                {archivos.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {archivos.map((archivo, index) => (
                        <div key={index} className="relative group aspect-square">
                          {archivo.esPdf ? (
                            <a
                              href={archivo.tipo === 'existente' ? archivo.url : '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex flex-col items-center justify-center h-full w-full rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                            >
                              <FileText className="h-8 w-8 text-red-500" />
                              <span className="text-xs text-muted-foreground mt-1 px-1 text-center truncate w-full">
                                {archivo.nombre}
                              </span>
                            </a>
                          ) : (
                            <Image
                              src={archivo.url}
                              alt={`Imagen ${index + 1}`}
                              fill
                              className="object-cover rounded-lg border"
                            />
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => eliminarArchivo(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {archivos.length < 5 && (
                      <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary hover:bg-muted/50'}`}>
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {isDragging ? 'Suelta los archivos aqui' : 'Agregar mas archivos'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          className="hidden"
                          onChange={agregarArchivos}
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'hover:border-primary hover:bg-muted/50'}`}>
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground text-center">
                      {isDragging ? 'Suelta los archivos aqui' : 'Haz clic o arrastra fotos o PDFs del mantenimiento'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Maximo 5 archivos (imagenes o PDF)
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      className="hidden"
                      onChange={agregarArchivos}
                    />
                  </label>
                )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vehiculoSeleccionado && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vehiculo</span>
                      <span className="font-medium">{vehiculoSeleccionado.placa}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Km Actual</span>
                      <span className="font-medium">
                        {formatNumber(vehiculoSeleccionado.kilometraje)} km
                      </span>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium capitalize">{tipo}</span>
                </div>
                {categoriaInfo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Categoria</span>
                    <span className="font-medium">{categoriaInfo.nombre}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Repuestos</span>
                  <span className="font-medium">{repuestos.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Costo Repuestos</span>
                  <span className="font-medium">{formatearPesos(costoRepuestos)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Total Estimado</span>
                  <span className="font-bold text-lg">{formatearPesos(costoRepuestos)}</span>
                </div>

                {/* Proximo mantenimiento */}
                {categoriaInfo && kilometraje && (
                  <>
                    <Separator />
                    <div className="text-sm space-y-1">
                      <span className="text-muted-foreground">Proximo mantenimiento:</span>
                      {categoriaInfo.intervaloKm && (
                        <p className="font-medium">
                          {formatNumber(calcularProximoKm(categoria as CategoriaMantenimiento, parseInt(kilometraje)) || 0)} km
                        </p>
                      )}
                      {categoriaInfo.intervaloMeses && (
                        <p className="font-medium">
                          {calcularProximaFecha(categoria as CategoriaMantenimiento, fecha)?.toLocaleDateString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full" asChild>
                <Link href="/mantenimientos">Cancelar</Link>
              </Button>
            </div>
          </div>
        </div>
      </form>
    </MainLayout>
  );
}
