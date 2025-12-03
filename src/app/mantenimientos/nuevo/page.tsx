'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { vehiculos } from '@/data/vehiculos';
import { catalogoMantenimiento } from '@/data/tipos-mantenimiento';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Repuesto {
  nombre: string;
  cantidad: number;
  costoUnitario: number;
}

export default function NuevoMantenimientoPage() {
  const router = useRouter();
  const [vehiculoId, setVehiculoId] = useState('');
  const [tipo, setTipo] = useState<'preventivo' | 'correctivo'>('preventivo');
  const [categoria, setCategoria] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [kilometraje, setKilometraje] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);

  const vehiculoSeleccionado = vehiculos.find((v) => v.id === vehiculoId);
  const categoriasFiltradas = catalogoMantenimiento.filter((c) => c.tipo === tipo);

  const agregarRepuesto = () => {
    setRepuestos([...repuestos, { nombre: '', cantidad: 1, costoUnitario: 0 }]);
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
    (sum, r) => sum + r.cantidad * r.costoUnitario,
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // En un prototipo, simplemente mostramos alerta y redirigimos
    alert('Mantenimiento registrado exitosamente (simulacion)');
    router.push('/mantenimientos');
  };

  const formatearPesos = (valor: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(valor);
  };

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
                        setTipo(value as 'preventivo' | 'correctivo');
                        setCategoria('');
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
                    <Select value={categoria} onValueChange={setCategoria} required>
                      <SelectTrigger id="categoria">
                        <SelectValue placeholder="Seleccionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriasFiltradas.map((c) => (
                          <SelectItem key={c.categoria} value={c.categoria}>
                            {c.nombre}
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
                  <Label htmlFor="descripcion">Descripcion *</Label>
                  <Input
                    id="descripcion"
                    placeholder="Descripcion del trabajo realizado"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  />
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
                <CardTitle className="text-base">Repuestos Utilizados</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={agregarRepuesto}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
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
                          <Label className="text-xs">Costo Unit.</Label>
                          <Input
                            type="number"
                            min="0"
                            value={repuesto.costoUnitario}
                            onChange={(e) =>
                              actualizarRepuesto(
                                index,
                                'costoUnitario',
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
                    <Separator />
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tipo</span>
                  <span className="font-medium capitalize">{tipo}</span>
                </div>
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
              </CardContent>
            </Card>

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Guardar Mantenimiento
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
