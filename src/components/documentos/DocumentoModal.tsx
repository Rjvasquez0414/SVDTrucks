'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, FileText } from 'lucide-react';
import type { TipoDocumento, CategoriaDocumento, DocumentoInsert } from '@/types/database';
import { createDocumento } from '@/lib/queries/documentos';

// Catalogo de documentos por categoria
const catalogoDocumentos: Record<CategoriaDocumento, { tipo: TipoDocumento; nombre: string }[]> = {
  cabezote: [
    { tipo: 'soat', nombre: 'SOAT' },
    { tipo: 'poliza_rc_hidrocarburos', nombre: 'Poliza RC Hidrocarburos' },
    { tipo: 'revision_tecnomecanica', nombre: 'Revision Tecnomecanica' },
  ],
  tanque: [
    { tipo: 'prueba_hidrostatica', nombre: 'Prueba Hidrostatica' },
    { tipo: 'certificado_luz_negra', nombre: 'Certificado Luz Negra' },
    { tipo: 'programa_mantenimiento_copetran', nombre: 'Programa Mantenimiento Copetran' },
    { tipo: 'certificacion_quinta_rueda', nombre: 'Certificacion Quinta Rueda' },
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
    { tipo: 'poliza_rce_copetran', nombre: 'Poliza RCE Copetran' },
    { tipo: 'poliza_rce_exceso_copetran', nombre: 'Poliza RCE en Exceso Copetran' },
  ],
};

// Mapeo de categoria a entidad
const categoriaEntidad: Record<CategoriaDocumento, 'vehiculo' | 'remolque' | 'conductor'> = {
  cabezote: 'vehiculo',
  tanque: 'remolque',
  conductor: 'conductor',
  polizas: 'vehiculo', // Por defecto, pero algunos aplican a remolque
};

interface DocumentoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: CategoriaDocumento;
  vehiculoId: string;
  remolqueId: string | null;
  conductorId: string | null;
  onSuccess: () => void;
  tipoPreseleccionado?: TipoDocumento;
}

export function DocumentoModal({
  open,
  onOpenChange,
  categoria,
  vehiculoId,
  remolqueId,
  conductorId,
  onSuccess,
  tipoPreseleccionado,
}: DocumentoModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [tipo, setTipo] = useState<TipoDocumento | ''>(tipoPreseleccionado || '');
  const [fechaEmision, setFechaEmision] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [entidadEmisora, setEntidadEmisora] = useState('');
  const [notas, setNotas] = useState('');

  const documentosCategoria = catalogoDocumentos[categoria] || [];

  const resetForm = () => {
    setTipo(tipoPreseleccionado || '');
    setFechaEmision('');
    setFechaVencimiento('');
    setNumeroDocumento('');
    setEntidadEmisora('');
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

    if (!tipo) {
      setError('Seleccione el tipo de documento');
      return;
    }

    // Determinar a que entidad asignar el documento
    let entityId: { vehiculo_id?: string; remolque_id?: string; conductor_id?: string } = {};

    if (categoria === 'cabezote') {
      entityId.vehiculo_id = vehiculoId;
    } else if (categoria === 'tanque') {
      if (!remolqueId) {
        setError('No hay remolque asignado a este vehiculo');
        return;
      }
      entityId.remolque_id = remolqueId;
    } else if (categoria === 'conductor') {
      if (!conductorId) {
        setError('No hay conductor asignado a este vehiculo');
        return;
      }
      entityId.conductor_id = conductorId;
    } else if (categoria === 'polizas') {
      // Polizas de tanque van al remolque, resto al vehiculo
      if (tipo === 'poliza_todo_riesgo_tanque') {
        if (!remolqueId) {
          setError('No hay remolque asignado para esta poliza');
          return;
        }
        entityId.remolque_id = remolqueId;
      } else {
        entityId.vehiculo_id = vehiculoId;
      }
    }

    // Obtener nombre del documento
    const docInfo = documentosCategoria.find(d => d.tipo === tipo);
    const nombreDocumento = docInfo?.nombre || tipo;

    const documento: DocumentoInsert = {
      tipo: tipo as TipoDocumento,
      categoria,
      nombre: nombreDocumento,
      ...entityId,
      fecha_emision: fechaEmision || null,
      fecha_vencimiento: fechaVencimiento || null,
      numero_documento: numeroDocumento || null,
      entidad_emisora: entidadEmisora || null,
      notas: notas || null,
    };

    setIsLoading(true);

    try {
      await createDocumento(documento);
      handleClose();
      onSuccess();
    } catch (err) {
      console.error('Error al crear documento:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el documento');
    } finally {
      setIsLoading(false);
    }
  };

  const categoriaNombre: Record<CategoriaDocumento, string> = {
    cabezote: 'Cabezote',
    tanque: 'Tanque',
    conductor: 'Conductor',
    polizas: 'Polizas',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Agregar Documento - {categoriaNombre[categoria]}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Tipo de documento */}
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Documento *</Label>
            <Select
              value={tipo}
              onValueChange={(value) => setTipo(value as TipoDocumento)}
              disabled={!!tipoPreseleccionado}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar documento" />
              </SelectTrigger>
              <SelectContent>
                {documentosCategoria.map((doc) => (
                  <SelectItem key={doc.tipo} value={doc.tipo}>
                    {doc.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaEmision">Fecha de Emision</Label>
              <Input
                id="fechaEmision"
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaVencimiento">Fecha de Vencimiento</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
              />
            </div>
          </div>

          {/* Numero y Entidad */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroDocumento">Numero de Documento</Label>
              <Input
                id="numeroDocumento"
                placeholder="Ej: 12345678"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entidadEmisora">Entidad Emisora</Label>
              <Input
                id="entidadEmisora"
                placeholder="Ej: SURA, Colpatria..."
                value={entidadEmisora}
                onChange={(e) => setEntidadEmisora(e.target.value)}
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Input
              id="notas"
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
                  <Upload className="mr-2 h-4 w-4" />
                  Guardar Documento
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
