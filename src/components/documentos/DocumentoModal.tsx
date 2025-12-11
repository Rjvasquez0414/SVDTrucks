'use client';

import { useState, useRef } from 'react';
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
import { Loader2, Upload, FileText, X, File } from 'lucide-react';
import type { TipoDocumento, CategoriaDocumento, DocumentoInsert } from '@/types/database';
import { createDocumento } from '@/lib/queries/documentos';
import { supabase } from '@/lib/supabase';

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
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const documentosCategoria = catalogoDocumentos[categoria] || [];
  const docInfo = documentosCategoria.find(d => d.tipo === tipoPreseleccionado);
  const nombreDocumento = docInfo?.nombre || tipoPreseleccionado || '';

  const resetForm = () => {
    setFechaVencimiento('');
    setArchivo(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB max
        setError('El archivo no puede superar 10MB');
        return;
      }
      setArchivo(file);
      setError(null);
    }
  };

  const handleRemoveFile = () => {
    setArchivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; nombre: string } | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tipoPreseleccionado}_${Date.now()}.${fileExt}`;
      const filePath = `documentos/${vehiculoId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documentos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error('Error al subir el archivo');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documentos')
        .getPublicUrl(filePath);

      return { url: publicUrl, nombre: file.name };
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tipoPreseleccionado) {
      setError('Tipo de documento no especificado');
      return;
    }

    if (!fechaVencimiento) {
      setError('La fecha de vencimiento es requerida');
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
      if (tipoPreseleccionado === 'poliza_todo_riesgo_tanque') {
        if (!remolqueId) {
          setError('No hay remolque asignado para esta poliza');
          return;
        }
        entityId.remolque_id = remolqueId;
      } else {
        entityId.vehiculo_id = vehiculoId;
      }
    }

    setIsLoading(true);

    try {
      let archivoUrl: string | null = null;
      let archivoNombre: string | null = null;

      // Subir archivo si existe
      if (archivo) {
        const uploadResult = await uploadFile(archivo);
        if (uploadResult) {
          archivoUrl = uploadResult.url;
          archivoNombre = uploadResult.nombre;
        }
      }

      const documento: DocumentoInsert = {
        tipo: tipoPreseleccionado,
        categoria,
        nombre: nombreDocumento,
        ...entityId,
        fecha_vencimiento: fechaVencimiento,
        archivo_url: archivoUrl,
        archivo_nombre: archivoNombre,
      };

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {nombreDocumento}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Fecha de Vencimiento */}
          <div className="space-y-2">
            <Label htmlFor="fechaVencimiento">Fecha de Vencimiento *</Label>
            <Input
              id="fechaVencimiento"
              type="date"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              El sistema te alertara cuando el documento este proximo a vencer
            </p>
          </div>

          {/* Upload de archivo PDF */}
          <div className="space-y-2">
            <Label>Documento PDF (opcional)</Label>
            {!archivo ? (
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Haz clic para seleccionar un archivo PDF
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximo 10MB
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <File className="h-8 w-8 text-red-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{archivo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(archivo.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <DialogFooter className="pt-2">
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
                  Guardar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
