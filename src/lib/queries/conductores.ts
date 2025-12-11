import { supabase } from '@/lib/supabase';
import type { Conductor } from '@/types/database';

// Obtener todos los conductores
export async function getConductores(): Promise<Conductor[]> {
  const { data, error } = await supabase
    .from('conductores')
    .select('*')
    .eq('activo', true)
    .order('nombre');

  if (error) {
    console.error('Error fetching conductores:', error);
    return [];
  }

  return data;
}

// Obtener conductor por ID
export async function getConductorById(id: string): Promise<Conductor | null> {
  const { data, error } = await supabase
    .from('conductores')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching conductor:', error);
    return null;
  }

  return data;
}
