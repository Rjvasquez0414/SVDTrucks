import { supabase } from '@/lib/supabase';
import type { VehiculoCompleto } from '@/types/database';

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

