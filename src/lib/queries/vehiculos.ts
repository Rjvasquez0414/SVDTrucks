import { supabase } from '@/lib/supabase';
import type { Vehiculo, VehiculoCompleto, VehiculoInsert, VehiculoUpdate } from '@/types/database';

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
  const { data: vehiculos, error } = await supabase
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

  return {
    total: vehiculos.length,
    activos: vehiculos.filter((v) => v.estado === 'activo').length,
    enMantenimiento: vehiculos.filter((v) => v.estado === 'en_mantenimiento').length,
    inactivos: vehiculos.filter((v) => v.estado === 'inactivo').length,
  };
}

// Crear vehiculo
export async function createVehiculo(vehiculo: VehiculoInsert) {
  const { data, error } = await supabase
    .from('vehiculos')
    .insert(vehiculo)
    .select()
    .single();

  if (error) {
    console.error('Error creating vehiculo:', error);
    throw error;
  }

  return data;
}

// Actualizar vehiculo
export async function updateVehiculo(id: string, vehiculo: VehiculoUpdate) {
  const { data, error } = await supabase
    .from('vehiculos')
    .update(vehiculo)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating vehiculo:', error);
    throw error;
  }

  return data;
}

// Eliminar vehiculo
export async function deleteVehiculo(id: string) {
  const { error } = await supabase
    .from('vehiculos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting vehiculo:', error);
    throw error;
  }
}
