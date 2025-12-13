import { supabase } from '../supabase';
import type { CategoriaMantenimiento, TipoMantenimiento } from '@/types/database';

// =============================================
// TIPOS LOCALES
// =============================================

export interface Mantenimiento {
  id: string;
  vehiculo_id: string;
  tipo: TipoMantenimiento;
  categoria: CategoriaMantenimiento;
  descripcion: string;
  fecha: string;
  kilometraje: number;
  costo: number;
  proveedor: string | null;
  observaciones: string | null;
  proximo_km: number | null;
  proxima_fecha: string | null;
  imagenes: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface MantenimientoInsert {
  vehiculo_id: string;
  tipo: TipoMantenimiento;
  categoria: CategoriaMantenimiento;
  descripcion: string;
  fecha: string;
  kilometraje: number;
  costo?: number;
  proveedor?: string | null;
  observaciones?: string | null;
  proximo_km?: number | null;
  proxima_fecha?: string | null;
  imagenes?: string[];
  created_by?: string | null;
}

export interface Repuesto {
  id: string;
  mantenimiento_id: string;
  nombre: string;
  cantidad: number;
  costo_unitario: number;
  created_at: string;
}

export interface RepuestoInsert {
  mantenimiento_id: string;
  nombre: string;
  cantidad?: number;
  costo_unitario?: number;
}

export interface MantenimientoConVehiculo extends Mantenimiento {
  vehiculos: {
    placa: string;
    marca: string;
    modelo: string;
  };
}

// =============================================
// CONSULTAS DE MANTENIMIENTOS
// =============================================

/**
 * Obtiene todos los mantenimientos
 */
export async function getMantenimientos(): Promise<MantenimientoConVehiculo[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mantenimientos')
    .select(`
      *,
      vehiculos:vehiculo_id (placa, marca, modelo)
    `)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error fetching mantenimientos:', error);
    return [];
  }

  return (data as MantenimientoConVehiculo[]) || [];
}

/**
 * Obtiene los mantenimientos de un vehiculo especifico
 */
export async function getMantenimientosByVehiculo(vehiculoId: string): Promise<Mantenimiento[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mantenimientos')
    .select('*')
    .eq('vehiculo_id', vehiculoId)
    .order('fecha', { ascending: false });

  if (error) {
    console.error('Error fetching mantenimientos by vehiculo:', error);
    return [];
  }

  return (data as Mantenimiento[]) || [];
}

/**
 * Obtiene el ultimo mantenimiento de una categoria para un vehiculo
 */
export async function getUltimoMantenimiento(
  vehiculoId: string,
  categoria: CategoriaMantenimiento
): Promise<Mantenimiento | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mantenimientos')
    .select('*')
    .eq('vehiculo_id', vehiculoId)
    .eq('categoria', categoria)
    .order('fecha', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No rows found
    console.error('Error fetching ultimo mantenimiento:', error);
    return null;
  }

  return data as Mantenimiento;
}

/**
 * Obtiene los proximos mantenimientos pendientes basados en kilometraje
 */
export async function getProximosMantenimientos(limite: number = 10): Promise<MantenimientoConVehiculo[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mantenimientos')
    .select(`
      *,
      vehiculos:vehiculo_id (placa, marca, modelo)
    `)
    .not('proximo_km', 'is', null)
    .order('proximo_km', { ascending: true })
    .limit(limite);

  if (error) {
    console.error('Error fetching proximos mantenimientos:', error);
    return [];
  }

  return (data as MantenimientoConVehiculo[]) || [];
}

/**
 * Crea un nuevo mantenimiento
 */
export async function createMantenimiento(mantenimiento: MantenimientoInsert): Promise<Mantenimiento | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mantenimientos')
    .insert(mantenimiento)
    .select()
    .single();

  if (error) {
    console.error('Error creating mantenimiento:', error);
    throw new Error(error.message);
  }

  return data as Mantenimiento;
}

/**
 * Actualiza un mantenimiento existente
 */
export async function updateMantenimiento(
  id: string,
  updates: Partial<MantenimientoInsert>
): Promise<Mantenimiento | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mantenimientos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating mantenimiento:', error);
    throw new Error(error.message);
  }

  return data as Mantenimiento;
}

/**
 * Elimina un mantenimiento
 */
export async function deleteMantenimiento(id: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('mantenimientos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting mantenimiento:', error);
    throw new Error(error.message);
  }

  return true;
}

// =============================================
// CONSULTAS DE REPUESTOS
// =============================================

/**
 * Obtiene los repuestos de un mantenimiento
 */
export async function getRepuestosByMantenimiento(mantenimientoId: string): Promise<Repuesto[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('repuestos')
    .select('*')
    .eq('mantenimiento_id', mantenimientoId);

  if (error) {
    console.error('Error fetching repuestos:', error);
    return [];
  }

  return (data as Repuesto[]) || [];
}

/**
 * Crea repuestos para un mantenimiento
 */
export async function createRepuestos(repuestos: RepuestoInsert[]): Promise<Repuesto[]> {
  if (repuestos.length === 0) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('repuestos')
    .insert(repuestos)
    .select();

  if (error) {
    console.error('Error creating repuestos:', error);
    throw new Error(error.message);
  }

  return (data as Repuesto[]) || [];
}

// =============================================
// ESTADISTICAS
// =============================================

/**
 * Obtiene estadisticas de mantenimientos por vehiculo
 */
export async function getEstadisticasVehiculo(vehiculoId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mantenimientos')
    .select('tipo, costo, fecha')
    .eq('vehiculo_id', vehiculoId);

  if (error) {
    console.error('Error fetching estadisticas:', error);
    return null;
  }

  const mantenimientos = (data || []) as Array<{ tipo: string; costo: number; fecha: string }>;

  const totalPreventivos = mantenimientos.filter(m => m.tipo === 'preventivo').length;
  const totalCorrectivos = mantenimientos.filter(m => m.tipo === 'correctivo').length;
  const costoTotal = mantenimientos.reduce((sum, m) => sum + (m.costo || 0), 0);

  // Costos del ultimo mes
  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);
  const costoUltimoMes = mantenimientos
    .filter(m => new Date(m.fecha) >= hace30Dias)
    .reduce((sum, m) => sum + (m.costo || 0), 0);

  return {
    totalMantenimientos: mantenimientos.length,
    totalPreventivos,
    totalCorrectivos,
    costoTotal,
    costoUltimoMes,
  };
}

/**
 * Obtiene costos por mes para reportes
 */
export async function getCostosPorMes(año: number): Promise<{ mes: number; costo: number }[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('mantenimientos')
    .select('fecha, costo')
    .gte('fecha', `${año}-01-01`)
    .lte('fecha', `${año}-12-31`);

  if (error) {
    console.error('Error fetching costos por mes:', error);
    return [];
  }

  // Agrupar por mes
  const porMes: { [key: number]: number } = {};
  ((data || []) as Array<{ fecha: string; costo: number }>).forEach(m => {
    const mes = new Date(m.fecha).getMonth() + 1;
    porMes[mes] = (porMes[mes] || 0) + (m.costo || 0);
  });

  // Convertir a array
  return Object.entries(porMes).map(([mes, costo]) => ({
    mes: parseInt(mes),
    costo,
  }));
}

/**
 * Actualiza el kilometraje del vehiculo despues de un mantenimiento
 * Tambien actualiza la fecha de ultima actualizacion de kilometraje
 */
export async function actualizarKilometrajeVehiculo(vehiculoId: string, kilometraje: number): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('vehiculos')
    .update({
      kilometraje,
      kilometraje_updated_at: new Date().toISOString()
    })
    .eq('id', vehiculoId);

  if (error) {
    console.error('Error updating kilometraje:', error);
  }
}
