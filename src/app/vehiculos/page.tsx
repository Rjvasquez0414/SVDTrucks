'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { VehiculoCard } from '@/components/vehiculos/VehiculoCard';
import { VehiculoModal } from '@/components/vehiculos/VehiculoModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getVehiculos } from '@/lib/queries/vehiculos';
import { Plus, Search, LayoutGrid, List, Loader2 } from 'lucide-react';
import { EstadoVehiculo, VehiculoCompleto } from '@/types/database';
import { formatNumber } from '@/lib/utils';
import Link from 'next/link';

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<VehiculoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoVehiculo | 'todos'>('todos');
  const [filtroConductor, setFiltroConductor] = useState<string>('todos');
  const [vistaGrid, setVistaGrid] = useState(true);

  // Estados para el modal
  const [modalOpen, setModalOpen] = useState(false);
  const [vehiculoEditar, setVehiculoEditar] = useState<VehiculoCompleto | null>(null);

  // Obtener lista única de conductores de los vehículos
  const conductoresUnicos = vehiculos
    .filter(v => v.conductores)
    .map(v => v.conductores!)
    .filter((conductor, index, self) =>
      self.findIndex(c => c.id === conductor.id) === index
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  const loadVehiculos = useCallback(async () => {
    setLoading(true);
    const data = await getVehiculos();
    setVehiculos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Cargar vehiculos al montar el componente
    async function initVehiculos() {
      setLoading(true);
      const data = await getVehiculos();
      setVehiculos(data);
      setLoading(false);
    }
    initVehiculos();
  }, []);

  const handleNuevoVehiculo = () => {
    setVehiculoEditar(null);
    setModalOpen(true);
  };

  const handleEditarVehiculo = (vehiculo: VehiculoCompleto) => {
    setVehiculoEditar(vehiculo);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    loadVehiculos();
  };

  const vehiculosFiltrados = vehiculos.filter((v) => {
    const coincideBusqueda =
      v.placa.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.modelo.toLowerCase().includes(busqueda.toLowerCase());

    const coincideEstado = filtroEstado === 'todos' || v.estado === filtroEstado;
    const coincideConductor = filtroConductor === 'todos' || v.conductores?.id === filtroConductor;

    return coincideBusqueda && coincideEstado && coincideConductor;
  });

  return (
    <MainLayout title="Vehiculos">
      {/* Header actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por placa, marca..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <Select
            value={filtroEstado}
            onValueChange={(value) => setFiltroEstado(value as EstadoVehiculo | 'todos')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los estados</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem>
              <SelectItem value="inactivo">Inactivo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroConductor} onValueChange={setFiltroConductor}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Conductor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los conductores</SelectItem>
              {conductoresUnicos.map((conductor) => (
                <SelectItem key={conductor.id} value={conductor.id}>
                  {conductor.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border rounded-lg">
            <Button
              variant={vistaGrid ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setVistaGrid(true)}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={!vistaGrid ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setVistaGrid(false)}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Add button */}
          <Button onClick={handleNuevoVehiculo}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Vehiculo
          </Button>
        </div>
      </div>

      {/* Modal de vehiculo */}
      <VehiculoModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        vehiculo={vehiculoEditar}
        onSuccess={handleModalSuccess}
      />

      {/* Results count */}
      <p className="mt-4 text-sm text-muted-foreground">
        {loading ? 'Cargando...' : `Mostrando ${vehiculosFiltrados.length} de ${vehiculos.length} vehiculos`}
      </p>

      {/* Loading state */}
      {loading && (
        <div className="mt-8 flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">Cargando vehiculos...</p>
        </div>
      )}

      {/* Vehicles grid/list */}
      {!loading && vistaGrid && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehiculosFiltrados.map((vehiculo) => (
            <VehiculoCard
              key={vehiculo.id}
              vehiculo={vehiculo}
              onEditar={handleEditarVehiculo}
            />
          ))}
        </div>
      )}

      {!loading && !vistaGrid && (
        <div className="mt-4 space-y-2">
          {vehiculosFiltrados.map((vehiculo) => (
            <div
              key={vehiculo.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <span className="text-lg font-semibold">{vehiculo.placa.slice(0, 3)}</span>
                </div>
                <div>
                  <p className="font-medium">{vehiculo.placa}</p>
                  <p className="text-sm text-muted-foreground">
                    {vehiculo.marca} {vehiculo.modelo} ({vehiculo.año})
                  </p>
                  {vehiculo.conductores && (
                    <p className="text-xs text-muted-foreground">
                      Conductor: {vehiculo.conductores.nombre}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-medium">{formatNumber(vehiculo.kilometraje)} km</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {vehiculo.estado.replace('_', ' ')}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/vehiculos/${vehiculo.id}`}>Ver</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && vehiculosFiltrados.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No se encontraron vehiculos</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Intenta ajustar los filtros de busqueda
          </p>
        </div>
      )}
    </MainLayout>
  );
}
