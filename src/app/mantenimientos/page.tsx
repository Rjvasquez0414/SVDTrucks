'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mantenimientos } from '@/data/mantenimientos';
import { vehiculos, getVehiculoById } from '@/data/vehiculos';
import { getCategoriaInfo } from '@/data/tipos-mantenimiento';
import { Plus, Search, Calendar, Wrench, Eye } from 'lucide-react';
import { TipoMantenimiento } from '@/types';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';

export default function MantenimientosPage() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoMantenimiento | 'todos'>('todos');
  const [filtroVehiculo, setFiltroVehiculo] = useState<string>('todos');

  const mantenimientosFiltrados = mantenimientos
    .filter((m) => {
      const vehiculo = getVehiculoById(m.vehiculoId);
      const categoriaInfo = getCategoriaInfo(m.categoria);

      const coincideBusqueda =
        vehiculo?.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
        categoriaInfo?.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.descripcion.toLowerCase().includes(busqueda.toLowerCase());

      const coincideTipo = filtroTipo === 'todos' || m.tipo === filtroTipo;
      const coincideVehiculo = filtroVehiculo === 'todos' || m.vehiculoId === filtroVehiculo;

      return coincideBusqueda && coincideTipo && coincideVehiculo;
    })
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
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

  const costoTotal = mantenimientosFiltrados.reduce((sum, m) => sum + m.costo, 0);

  return (
    <MainLayout title="Mantenimientos">
      {/* Header actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar mantenimiento..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <Select
            value={filtroTipo}
            onValueChange={(value) => setFiltroTipo(value as TipoMantenimiento | 'todos')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="preventivo">Preventivo</SelectItem>
              <SelectItem value="correctivo">Correctivo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroVehiculo} onValueChange={setFiltroVehiculo}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Vehiculo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los vehiculos</SelectItem>
              {vehiculos.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.placa} - {v.marca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Link href="/mantenimientos/nuevo">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Mantenimiento
          </Button>
        </Link>
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Wrench className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mantenimientosFiltrados.length}</p>
                <p className="text-sm text-muted-foreground">Mantenimientos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mantenimientosFiltrados.filter((m) => m.tipo === 'preventivo').length}
                </p>
                <p className="text-sm text-muted-foreground">Preventivos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <Wrench className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatearPesos(costoTotal)}</p>
                <p className="text-sm text-muted-foreground">Costo Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Vehiculo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Kilometraje</TableHead>
                <TableHead className="text-right">Costo</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mantenimientosFiltrados.map((m) => {
                const vehiculo = getVehiculoById(m.vehiculoId);
                const categoriaInfo = getCategoriaInfo(m.categoria);

                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {formatearFecha(m.fecha)}
                    </TableCell>
                    <TableCell>
                      {vehiculo ? (
                        <Link
                          href={`/vehiculos/${vehiculo.id}`}
                          className="hover:underline"
                        >
                          <span className="font-medium">{vehiculo.placa}</span>
                          <span className="text-muted-foreground ml-1">
                            {vehiculo.marca}
                          </span>
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={m.tipo === 'preventivo' ? 'secondary' : 'outline'}
                      >
                        {m.tipo === 'preventivo' ? 'Preventivo' : 'Correctivo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{categoriaInfo?.nombre || m.categoria}</TableCell>
                    <TableCell>{formatNumber(m.kilometraje)} km</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatearPesos(m.costo)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {mantenimientosFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wrench className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                No se encontraron mantenimientos
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Intenta ajustar los filtros de busqueda
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
