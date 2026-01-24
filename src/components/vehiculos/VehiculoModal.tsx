'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Loader2, Truck, Save } from 'lucide-react';
import { createVehiculo, updateVehiculo } from '@/lib/queries/vehiculos';
import { getConductores } from '@/lib/queries/conductores';
import { getRemolques } from '@/lib/queries/remolques';
import type { VehiculoCompleto, Conductor, Remolque, TipoVehiculo, EstadoVehiculo } from '@/types/database';

interface VehiculoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehiculo?: VehiculoCompleto | null;
  onSuccess: () => void;
}

export function VehiculoModal({
  open,
  onOpenChange,
  vehiculo,
  onSuccess,
}: VehiculoModalProps) {
  const isEditing = !!vehiculo;

  // Estados del formulario
  const [placa, setPlaca] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [año, setAño] = useState(new Date().getFullYear());
  const [tipo, setTipo] = useState<TipoVehiculo>('tractomula');
  const [kilometraje, setKilometraje] = useState(0);
  const [estado, setEstado] = useState<EstadoVehiculo>('activo');
  const [fechaAdquisicion, setFechaAdquisicion] = useState(new Date().toISOString().split('T')[0]);
  const [color, setColor] = useState('');
  const [numeroMotor, setNumeroMotor] = useState('');
  const [numeroChasis, setNumeroChasis] = useState('');
  const [conductorId, setConductorId] = useState<string | null>(null);
  const [remolqueId, setRemolqueId] = useState<string | null>(null);
  const [notas, setNotas] = useState('');

  // Estados de carga
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [remolques, setRemolques] = useState<Remolque[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Cargar conductores y remolques
  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      const [conductoresData, remolquesData] = await Promise.all([
        getConductores(),
        getRemolques(),
      ]);
      setConductores(conductoresData);
      setRemolques(remolquesData);
      setLoadingData(false);
    }
    if (open) {
      loadData();
    }
  }, [open]);

  // Cargar datos del vehiculo si estamos editando
  useEffect(() => {
    if (vehiculo) {
      setPlaca(vehiculo.placa);
      setMarca(vehiculo.marca);
      setModelo(vehiculo.modelo);
      setAño(vehiculo.año);
      setTipo(vehiculo.tipo);
      setKilometraje(vehiculo.kilometraje);
      setEstado(vehiculo.estado);
      setFechaAdquisicion(vehiculo.fecha_adquisicion);
      setColor(vehiculo.color || '');
      setNumeroMotor(vehiculo.numero_motor || '');
      setNumeroChasis(vehiculo.numero_chasis || '');
      setConductorId(vehiculo.conductor_id);
      setRemolqueId(vehiculo.remolque_id);
      setNotas(vehiculo.notas || '');
    } else {
      resetForm();
    }
  }, [vehiculo, open]);

  const resetForm = () => {
    setPlaca('');
    setMarca('');
    setModelo('');
    setAño(new Date().getFullYear());
    setTipo('tractomula');
    setKilometraje(0);
    setEstado('activo');
    setFechaAdquisicion(new Date().toISOString().split('T')[0]);
    setColor('');
    setNumeroMotor('');
    setNumeroChasis('');
    setConductorId(null);
    setRemolqueId(null);
    setNotas('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!placa.trim()) {
      setError('La placa es requerida');
      return;
    }
    if (!marca.trim()) {
      setError('La marca es requerida');
      return;
    }
    if (!modelo.trim()) {
      setError('El modelo es requerido');
      return;
    }
    if (!año || año < 1900 || año > new Date().getFullYear() + 1) {
      setError('El año no es valido');
      return;
    }
    if (!fechaAdquisicion) {
      setError('La fecha de adquisicion es requerida');
      return;
    }

    setIsLoading(true);

    try {
      const vehiculoData = {
        placa: placa.toUpperCase().trim(),
        marca: marca.trim(),
        modelo: modelo.trim(),
        año,
        tipo,
        kilometraje,
        estado,
        fecha_adquisicion: fechaAdquisicion,
        color: color.trim() || null,
        numero_motor: numeroMotor.trim() || null,
        numero_chasis: numeroChasis.trim() || null,
        conductor_id: conductorId,
        remolque_id: remolqueId,
        notas: notas.trim() || null,
      };

      if (isEditing && vehiculo) {
        await updateVehiculo(vehiculo.id, vehiculoData);
      } else {
        await createVehiculo(vehiculoData);
      }

      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Error al guardar vehiculo:', err);
      if (err instanceof Error) {
        if (err.message.includes('duplicate') || err.message.includes('unique')) {
          setError('Ya existe un vehiculo con esta placa');
        } else {
          setError(err.message);
        }
      } else {
        setError('Error al guardar el vehiculo');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            {isEditing ? 'Editar Vehiculo' : 'Nuevo Vehiculo'}
          </DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Informacion basica */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="placa">Placa *</Label>
                <Input
                  id="placa"
                  placeholder="ABC 123"
                  value={placa}
                  onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as TipoVehiculo)}>
                  <SelectTrigger id="tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tractomula">Tractomula</SelectItem>
                    <SelectItem value="camion">Camion</SelectItem>
                    <SelectItem value="volqueta">Volqueta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="marca">Marca *</Label>
                <Input
                  id="marca"
                  placeholder="Kenworth"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modelo">Modelo *</Label>
                <Input
                  id="modelo"
                  placeholder="T800"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="año">Año *</Label>
                <Input
                  id="año"
                  type="number"
                  min={1900}
                  max={new Date().getFullYear() + 1}
                  value={año}
                  onChange={(e) => setAño(parseInt(e.target.value) || new Date().getFullYear())}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="kilometraje">Kilometraje *</Label>
                <Input
                  id="kilometraje"
                  type="number"
                  min={0}
                  value={kilometraje}
                  onChange={(e) => setKilometraje(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <Select value={estado} onValueChange={(v) => setEstado(v as EstadoVehiculo)}>
                  <SelectTrigger id="estado">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="en_mantenimiento">En Mantenimiento</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaAdquisicion">Fecha Adquisicion *</Label>
                <Input
                  id="fechaAdquisicion"
                  type="date"
                  value={fechaAdquisicion}
                  onChange={(e) => setFechaAdquisicion(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="Blanco"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroMotor">No. Motor</Label>
                <Input
                  id="numeroMotor"
                  placeholder="Numero de motor"
                  value={numeroMotor}
                  onChange={(e) => setNumeroMotor(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroChasis">No. Chasis</Label>
                <Input
                  id="numeroChasis"
                  placeholder="Numero de chasis"
                  value={numeroChasis}
                  onChange={(e) => setNumeroChasis(e.target.value)}
                />
              </div>
            </div>

            {/* Asignaciones */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="conductor">Conductor</Label>
                <Select
                  value={conductorId || 'ninguno'}
                  onValueChange={(v) => setConductorId(v === 'ninguno' ? null : v)}
                >
                  <SelectTrigger id="conductor">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin asignar</SelectItem>
                    {conductores.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} {c.cedula ? `(${c.cedula})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="remolque">Remolque / Tanque</Label>
                <Select
                  value={remolqueId || 'ninguno'}
                  onValueChange={(v) => setRemolqueId(v === 'ninguno' ? null : v)}
                >
                  <SelectTrigger id="remolque">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ninguno">Sin asignar</SelectItem>
                    {remolques.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.placa} {r.tipo ? `(${r.tipo})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <textarea
                id="notas"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Observaciones adicionales..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {isEditing ? 'Guardar Cambios' : 'Crear Vehiculo'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
