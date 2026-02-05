'use client';

import { useState, useEffect } from 'react';
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
  createMantenimiento,
  createRepuestos,
  actualizarKilometrajeVehiculo,
} from '@/lib/queries/mantenimientos';
import { ArrowLeft, Save, Plus, X, Loader2, Info, ImagePlus, Trash2 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import type { VehiculoCompleto, CategoriaMantenimiento, TipoMantenimiento } from '@/types/database';

interface Repuesto {
  nombre: string;
  cantidad: number;
  costoTotal: number;
}

export default function NuevoMantenimientoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { usuario } = useAuth();

  // Obtener vehiculo de la URL si existe
  const vehiculoIdFromUrl = searchParams.get('vehiculo');

  // Estados del formulario
  const [vehiculoId, setVehiculoId] = useState(vehiculoIdFromUrl || '');
  const [tipo, setTipo] = useState<TipoMantenimiento>('preventivo');
  const [categoria, setCategoria] = useState<CategoriaMantenimiento | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [kilometraje, setKilometraje] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [imagenesPreview, setImagenesPreview] = useState<string[]>([]);

  // Estados de carga
  const [vehiculos, setVehiculos] = useState<VehiculoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar vehiculos al inicio
  useEffect(() => {
    async function loadVehiculos() {
      const data = await getVehiculos();
      setVehiculos(data);
      setLoading(false);
    }
    loadVehiculos();
  }, []);

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === vehiculoId);
  const categoriasFiltradas = catalogoMantenimiento.filter((c) => c.tipo === tipo);
  const categoriaInfo = categoria ? getCategoriaInfo(categoria) : null;

  // Auto-rellenar descripcion cuando se selecciona categoria (excepto "otro")
  useEffect(() => {
    if (categoriaInfo && !descripcion && categoria !== 'otro') {
      setDescripcion(categoriaInfo.descripcion);
    }
  }, [categoriaInfo, descripcion, categoria]);

  // Auto-rellenar kilometraje con el actual del vehiculo
  useEffect(() => {
    if (vehiculoSeleccionado && !kilometraje) {
      setKilometraje(vehiculoSeleccionado.kilometraje.toString());
    }
  }, [vehiculoSeleccionado, kilometraje]);

  // Agregar insumos tipicos como repuestos
  const agregarInsumosTipicos = () => {
    if (categoriaInfo?.insumosTipicos) {
      const nuevosRepuestos = categoriaInfo.insumosTipicos.map((insumo) => ({
        nombre: insumo,
        cantidad: 1,
        costoTotal: 0,
      }));
      setRepuestos([...repuestos, ...nuevosRepuestos]);
    }
  };

  const agregarRepuesto = () => {
    setRepuestos([...repuestos, { nombre: '', cantidad: 1, costoTotal: 0 }]);
  };

  const actualizarRepuesto = (index: number, field: keyof Repuesto, value: string | number) => {
    const nuevosRepuestos = [...repuestos];
    nuevosRepuestos[index] = { ...nuevosRepuestos[index], [field]: value };
    setRepuestos(nuevosRepuestos);
  };

  const eliminarRepuesto = (index: number) => {
    setRepuestos(repuestos.filter((_, i) => i !== index));
  };

  const costoRepuestos = repuestos.reduce(
    (sum, r) => sum + r.costoTotal,
    0
  );

  // Funciones para manejo de imagenes
  const agregarImagenes = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limitar a 5 imagenes maximo
    const nuevasImagenes = [...imagenes, ...files].slice(0, 5);
    setImagenes(nuevasImagenes);

    // Crear previews
    const previews = nuevasImagenes.map((file) => URL.createObjectURL(file));
    // Limpiar previews anteriores
    imagenesPreview.forEach((url) => URL.revokeObjectURL(url));
    setImagenesPreview(previews);
  };

  const eliminarImagen = (index: number) => {
    URL.revokeObjectURL(imagenesPreview[index]);
    setImagenes(imagenes.filter((_, i) => i !== index));
    setImagenesPreview(imagenesPreview.filter((_, i) => i !== index));
  };

  const subirImagenes = async (mantenimientoId: string): Promise<string[]> => {
    const urls: string[] = [];

    for (const file of imagenes) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${mantenimientoId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('mantenimientos')
        .upload(fileName, file);

      if (error) {
        console.error('Error subiendo imagen:', error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('mantenimientos')
        .getPublicUrl(fileName);

      urls.push(urlData.publicUrl);
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

      // Calcular proximo mantenimiento
      const proximoKm = calcularProximoKm(categoria, kmActual);
      const proximaFecha = calcularProximaFecha(categoria, fecha);

      // Crear el mantenimiento
      const mantenimiento = await createMantenimiento({
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
        created_by: usuario?.id || null,
      });

      if (!mantenimiento) {
        throw new Error('Error al crear el mantenimiento');
      }

      // Subir imagenes si hay
      if (imagenes.length > 0) {
        const imageUrls = await subirImagenes(mantenimiento.id);
        if (imageUrls.length > 0) {
          // Actualizar el mantenimiento con las URLs de imagenes
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from('mantenimientos')
            .update({ imagenes: imageUrls })
            .eq('id', mantenimiento.id);
        }
      }

      // Crear repuestos si hay
      if (repuestos.length > 0) {
        const repuestosData = repuestos
          .filter((r) => r.nombre.trim())
          .map((r) => ({
            mantenimiento_id: mantenimiento.id,
            nombre: r.nombre,
            cantidad: r.cantidad,
            costo_unitario: r.cantidad > 0 ? Math.round(r.costoTotal / r.cantidad) : r.costoTotal,
          }));

        if (repuestosData.length > 0) {
          await createRepuestos(repuestosData);
        }
      }

      // Actualizar kilometraje del vehiculo si es mayor
      if (vehiculoSeleccionado && kmActual > vehiculoSeleccionado.kilometraje) {
        await actualizarKilometrajeVehiculo(vehiculoId, kmActual);
      }

      router.push('/mantenimientos');
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el mantenimiento');
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
      <MainLayout title="Nuevo Mantenimiento">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Nuevo Mantenimiento">
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

            {/* Información básica */}
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
                      <SelectContent>
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

                {/* Info de la categoria seleccionada (excepto "otro") */}
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

                {/* Campo especial para categoria "Otro" */}
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
                          />
                        </div>
                        <div className="w-20 space-y-1">
                          <Label className="text-xs">Cant.</Label>
                          <Input
                            type="number"
                            min="1"
                            value={repuesto.cantidad}
                            onChange={(e) =>
                              actualizarRepuesto(index, 'cantidad', parseInt(e.target.value) || 1)
                            }
                          />
                        </div>
                        <div className="w-32 space-y-1">
                          <Label className="text-xs">Costo Total</Label>
                          <Input
                            type="number"
                            min="0"
                            value={repuesto.costoTotal}
                            onChange={(e) =>
                              actualizarRepuesto(
                                index,
                                'costoTotal',
                                parseInt(e.target.value) || 0
                              )
                            }
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

            {/* Imagenes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Imagenes / Fotos</CardTitle>
                <span className="text-xs text-muted-foreground">
                  {imagenes.length}/5 imagenes
                </span>
              </CardHeader>
              <CardContent>
                {imagenesPreview.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {imagenesPreview.map((preview, index) => (
                        <div key={index} className="relative group aspect-square">
                          <Image
                            src={preview}
                            alt={`Imagen ${index + 1}`}
                            fill
                            className="object-cover rounded-lg border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => eliminarImagen(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {imagenes.length < 5 && (
                      <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                        <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Agregar mas imagenes
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={agregarImagenes}
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors">
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground text-center">
                      Haz clic para agregar fotos del mantenimiento
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Maximo 5 imagenes
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={agregarImagenes}
                    />
                  </label>
                )}
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
                    Guardar Mantenimiento
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
