import { supabase } from '../supabase';
import type { Documento, DocumentoInsert, CatalogoDocumento } from '@/types/database';

// =============================================
// CONSULTAS DE DOCUMENTOS
// =============================================

// Nota: Usamos type assertions porque la tabla 'documentos' fue agregada
// despues de generar los tipos iniciales de Supabase

/**
 * Obtiene todos los documentos de un vehiculo
 */
export async function getDocumentosByVehiculo(vehiculoId: string): Promise<Documento[]> {
  const { data, error } = await supabase
    .from('documentos' as 'vehiculos')
    .select('*')
    .eq('vehiculo_id', vehiculoId)
    .order('fecha_vencimiento', { ascending: true });

  if (error) {
    console.error('Error fetching documentos by vehiculo:', error);
    return [];
  }

  return (data as unknown as Documento[]) || [];
}

/**
 * Obtiene todos los documentos de un remolque
 */
export async function getDocumentosByRemolque(remolqueId: string): Promise<Documento[]> {
  const { data, error } = await supabase
    .from('documentos' as 'vehiculos')
    .select('*')
    .eq('remolque_id', remolqueId)
    .order('fecha_vencimiento', { ascending: true });

  if (error) {
    console.error('Error fetching documentos by remolque:', error);
    return [];
  }

  return (data as unknown as Documento[]) || [];
}

/**
 * Obtiene todos los documentos de un conductor
 */
export async function getDocumentosByConductor(conductorId: string): Promise<Documento[]> {
  const { data, error } = await supabase
    .from('documentos' as 'vehiculos')
    .select('*')
    .eq('conductor_id', conductorId)
    .order('fecha_vencimiento', { ascending: true });

  if (error) {
    console.error('Error fetching documentos by conductor:', error);
    return [];
  }

  return (data as unknown as Documento[]) || [];
}

/**
 * Obtiene todos los documentos asociados a un vehiculo y sus relaciones
 * (vehiculo, remolque asignado, conductor asignado)
 */
export async function getDocumentosCompletos(
  vehiculoId: string,
  remolqueId: string | null,
  conductorId: string | null
): Promise<Documento[]> {
  // Construir array de condiciones OR
  const conditions: string[] = [`vehiculo_id.eq.${vehiculoId}`];

  if (remolqueId) {
    conditions.push(`remolque_id.eq.${remolqueId}`);
  }

  if (conductorId) {
    conditions.push(`conductor_id.eq.${conductorId}`);
  }

  const { data, error } = await supabase
    .from('documentos' as 'vehiculos')
    .select('*')
    .or(conditions.join(','))
    .order('categoria', { ascending: true })
    .order('fecha_vencimiento', { ascending: true });

  if (error) {
    console.error('Error fetching documentos completos:', error);
    return [];
  }

  return (data as unknown as Documento[]) || [];
}

/**
 * Obtiene el catalogo de tipos de documentos
 */
export async function getCatalogoDocumentos(): Promise<CatalogoDocumento[]> {
  const { data, error } = await supabase
    .from('catalogo_documentos' as 'vehiculos')
    .select('*')
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) {
    console.error('Error fetching catalogo documentos:', error);
    return [];
  }

  return (data as unknown as CatalogoDocumento[]) || [];
}

/**
 * Crea un nuevo documento
 */
export async function createDocumento(documento: DocumentoInsert): Promise<Documento | null> {
  const { data, error } = await supabase
    .from('documentos' as 'vehiculos')
    .insert(documento as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating documento:', error);
    throw new Error(error.message);
  }

  return data as unknown as Documento;
}

/**
 * Actualiza un documento existente
 */
export async function updateDocumento(
  id: string,
  updates: Partial<DocumentoInsert>
): Promise<Documento | null> {
  const { data, error } = await supabase
    .from('documentos' as 'vehiculos')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating documento:', error);
    throw new Error(error.message);
  }

  return data as unknown as Documento;
}

/**
 * Elimina un documento
 */
export async function deleteDocumento(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('documentos' as 'vehiculos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting documento:', error);
    throw new Error(error.message);
  }

  return true;
}

/**
 * Obtiene documentos proximos a vencer (30 dias)
 */
export async function getDocumentosProximosVencer(dias: number = 30): Promise<Documento[]> {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + dias);

  const { data, error } = await supabase
    .from('documentos' as 'vehiculos')
    .select('*')
    .not('fecha_vencimiento', 'is', null)
    .lte('fecha_vencimiento', fechaLimite.toISOString().split('T')[0])
    .order('fecha_vencimiento', { ascending: true });

  if (error) {
    console.error('Error fetching documentos proximos a vencer:', error);
    return [];
  }

  return (data as unknown as Documento[]) || [];
}
