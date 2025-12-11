import { supabase } from '@/lib/supabase';
import type { Remolque } from '@/types/database';

// Obtener todos los remolques
export async function getRemolques(): Promise<Remolque[]> {
  const { data, error } = await supabase
    .from('remolques')
    .select('*')
    .order('placa');

  if (error) {
    console.error('Error fetching remolques:', error);
    return [];
  }

  return data;
}

// Obtener remolque por ID
export async function getRemolqueById(id: string): Promise<Remolque | null> {
  const { data, error } = await supabase
    .from('remolques')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching remolque:', error);
    return null;
  }

  return data;
}
