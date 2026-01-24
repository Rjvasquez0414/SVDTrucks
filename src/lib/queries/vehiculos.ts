import { supabase } from '@/lib/supabase';
import type { VehiculoCompleto, Vehiculo, Database } from '@/types/database';

type VehiculoInsert = Database['public']['Tables']['vehiculos']['Insert'];
type VehiculoUpdate = Database['public']['Tables']['vehiculos']['Update'];

// Obtener todos los vehiculos con conductor y remolque
export async function getVehiculos(): Promise<VehiculoCompleto[]> {
  const { data, error } = await supabase
    .from('vehiculos')
    .select(`
      *,
      conductores:conductor_id (id, nombre, cedula),
      remolques:remolque_id (id, placa)
    `)
    .order('placa');

  if (error) {
    console.error('Error fetching vehiculos:', error);
    return [];
  }

  return data as VehiculoCompleto[];
}

// Obtener un vehiculo por ID
export async function getVehiculoById(id: string): Promise<VehiculoCompleto | null> {
  const { data, error } = await supabase
    .from('vehiculos')
    .select(`
      *,
      conductores:conductor_id (id, nombre, cedula),
      remolques:remolque_id (id, placa)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching vehiculo:', error);
    return null;
  }

  return data as VehiculoCompleto;
}

// Obtener estadisticas de la flota
export async function getEstadisticasFlota() {
  const { data, error } = await supabase
    .from('vehiculos')
    .select('estado');

  if (error) {
    console.error('Error fetching estadisticas:', error);
    return {
      total: 0,
      activos: 0,
      enMantenimiento: 0,
      inactivos: 0,
    };
  }

  const vehiculos = data as { estado: string }[];

  return {
    total: vehiculos.length,
    activos: vehiculos.filter((v) => v.estado === 'activo').length,
    enMantenimiento: vehiculos.filter((v) => v.estado === 'en_mantenimiento').length,
    inactivos: vehiculos.filter((v) => v.estado === 'inactivo').length,
  };
}

// Crear un nuevo vehiculo
export async function createVehiculo(vehiculo: VehiculoInsert): Promise<Vehiculo | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('vehiculos')
    .insert(vehiculo)
    .select()
    .single();

  if (error) {
    console.error('Error creating vehiculo:', error);
    throw new Error(error.message);
  }

  return data as Vehiculo;
}

// Actualizar un vehiculo existente
export async function updateVehiculo(id: string, updates: VehiculoUpdate): Promise<Vehiculo | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('vehiculos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating vehiculo:', error);
    throw new Error(error.message);
  }

  return data as Vehiculo;
}

// Buscar vehiculos por placa, marca o modelo
export async function searchVehiculos(query: string): Promise<VehiculoCompleto[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const searchTerm = query.trim().toLowerCase();

  const { data, error } = await supabase
    .from('vehiculos')
    .select(`
      *,
      conductores:conductor_id (id, nombre, cedula),
      remolques:remolque_id (id, placa)
    `)
    .or(`placa.ilike.%${searchTerm}%,marca.ilike.%${searchTerm}%,modelo.ilike.%${searchTerm}%`)
    .limit(5);

  if (error) {
    console.error('Error searching vehiculos:', error);
    return [];
  }

  return data as VehiculoCompleto[];
}

