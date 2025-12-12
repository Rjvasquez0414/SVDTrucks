import { supabase } from '../supabase';
import type { TipoAlerta, PrioridadAlerta, EstadoAlerta } from '@/types/database';
import { catalogoMantenimiento } from '@/data/tipos-mantenimiento';

// =============================================
// TIPOS LOCALES
// =============================================

export interface Alerta {
  id: string;
  vehiculo_id: string;
  tipo: TipoAlerta;
  prioridad: PrioridadAlerta;
  mensaje: string;
  fecha_generada: string;
  estado: EstadoAlerta;
  kilometraje_actual: number | null;
  kilometraje_limite: number | null;
  fecha_limite: string | null;
  atendida_por: string | null;
  atendida_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertaConVehiculo extends Alerta {
  vehiculos: {
    placa: string;
    marca: string;
    modelo: string;
  };
}

export interface AlertaInsert {
  vehiculo_id: string;
  tipo: TipoAlerta;
  prioridad: PrioridadAlerta;
  mensaje: string;
  kilometraje_actual?: number | null;
  kilometraje_limite?: number | null;
  fecha_limite?: string | null;
}

// =============================================
// CONSULTAS DE ALERTAS
// =============================================

/**
 * Obtiene todas las alertas pendientes
 */
export async function getAlertasPendientes(): Promise<AlertaConVehiculo[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('alertas')
    .select(`
      *,
      vehiculos:vehiculo_id (placa, marca, modelo)
    `)
    .eq('estado', 'pendiente')
    .order('prioridad', { ascending: true })
    .order('fecha_generada', { ascending: false });

  if (error) {
    console.error('Error fetching alertas:', error);
    return [];
  }

  return (data as AlertaConVehiculo[]) || [];
}

/**
 * Cuenta alertas por prioridad
 */
export async function contarAlertasPorPrioridad(): Promise<{ alta: number; media: number; baja: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('alertas')
    .select('prioridad')
    .eq('estado', 'pendiente');

  if (error) {
    console.error('Error counting alertas:', error);
    return { alta: 0, media: 0, baja: 0 };
  }

  const alertas = (data || []) as Array<{ prioridad: PrioridadAlerta }>;
  return {
    alta: alertas.filter(a => a.prioridad === 'alta').length,
    media: alertas.filter(a => a.prioridad === 'media').length,
    baja: alertas.filter(a => a.prioridad === 'baja').length,
  };
}

/**
 * Marca una alerta como atendida
 */
export async function marcarAlertaAtendida(id: string, usuarioId?: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('alertas')
    .update({
      estado: 'atendida',
      atendida_por: usuarioId,
      atendida_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error marking alerta as atendida:', error);
    return false;
  }

  return true;
}

/**
 * Descarta una alerta
 */
export async function descartarAlerta(id: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('alertas')
    .update({ estado: 'descartada' })
    .eq('id', id);

  if (error) {
    console.error('Error descartando alerta:', error);
    return false;
  }

  return true;
}

/**
 * Crea una nueva alerta
 */
export async function crearAlerta(alerta: AlertaInsert): Promise<Alerta | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('alertas')
    .insert(alerta)
    .select()
    .single();

  if (error) {
    console.error('Error creating alerta:', error);
    return null;
  }

  return data as Alerta;
}

// =============================================
// GENERACION AUTOMATICA DE ALERTAS
// =============================================

/**
 * Calcula la prioridad basada en km restantes o dias restantes
 */
function calcularPrioridad(kmRestantes?: number, diasRestantes?: number): PrioridadAlerta {
  // Por kilometraje
  if (kmRestantes !== undefined) {
    if (kmRestantes <= 0) return 'alta';        // Ya paso el limite
    if (kmRestantes <= 1000) return 'alta';     // Menos de 1,000 km
    if (kmRestantes <= 3000) return 'media';    // Menos de 3,000 km
    return 'baja';                               // Mas de 3,000 km
  }

  // Por tiempo
  if (diasRestantes !== undefined) {
    if (diasRestantes <= 0) return 'alta';      // Ya vencio
    if (diasRestantes <= 7) return 'alta';      // Menos de 1 semana
    if (diasRestantes <= 30) return 'media';    // Menos de 1 mes
    return 'baja';                               // Mas de 1 mes
  }

  return 'media';
}

/**
 * Genera alertas de mantenimiento basadas en kilometraje
 */
export async function generarAlertasMantenimientoKm(): Promise<number> {
  let alertasCreadas = 0;

  // Obtener todos los vehiculos activos con sus kilometrajes
  const { data: vehiculosData, error: errorVehiculos } = await supabase
    .from('vehiculos')
    .select('id, placa, kilometraje')
    .eq('estado', 'activo');

  if (errorVehiculos || !vehiculosData) {
    console.error('Error fetching vehiculos:', errorVehiculos);
    return 0;
  }

  const vehiculos = vehiculosData as Array<{ id: string; placa: string; kilometraje: number }>;

  for (const vehiculo of vehiculos) {
    // Obtener los ultimos mantenimientos del vehiculo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mantenimientos } = await (supabase as any)
      .from('mantenimientos')
      .select('categoria, proximo_km')
      .eq('vehiculo_id', vehiculo.id)
      .not('proximo_km', 'is', null);

    // Verificar cada tipo de mantenimiento con intervalo de km
    for (const catInfo of catalogoMantenimiento.filter(c => c.intervaloKm)) {
      const ultimoMant = (mantenimientos as Array<{ categoria: string; proximo_km: number }> | null)?.find(
        m => m.categoria === catInfo.categoria
      );
      const proximoKm = ultimoMant?.proximo_km || catInfo.intervaloKm!;

      const kmRestantes = proximoKm - vehiculo.kilometraje;

      // Solo crear alerta si estamos dentro del umbral (5000 km antes)
      if (kmRestantes <= 5000) {
        // Verificar si ya existe una alerta pendiente para esto
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: alertaExistente } = await (supabase as any)
          .from('alertas')
          .select('id')
          .eq('vehiculo_id', vehiculo.id)
          .eq('tipo', 'mantenimiento_kilometraje')
          .eq('estado', 'pendiente')
          .eq('kilometraje_limite', proximoKm)
          .single();

        if (!alertaExistente) {
          const prioridad = calcularPrioridad(kmRestantes);
          const mensaje = kmRestantes <= 0
            ? `${catInfo.nombre} VENCIDO - ${vehiculo.placa} (${Math.abs(kmRestantes).toLocaleString()} km pasado)`
            : `${catInfo.nombre} proximo - ${vehiculo.placa} (${kmRestantes.toLocaleString()} km restantes)`;

          await crearAlerta({
            vehiculo_id: vehiculo.id,
            tipo: kmRestantes <= 0 ? 'mantenimiento_pendiente' : 'mantenimiento_kilometraje',
            prioridad,
            mensaje,
            kilometraje_actual: vehiculo.kilometraje,
            kilometraje_limite: proximoKm,
          });

          alertasCreadas++;
        }
      }
    }
  }

  return alertasCreadas;
}

/**
 * Genera alertas de documentos proximos a vencer
 */
export async function generarAlertasDocumentos(): Promise<number> {
  let alertasCreadas = 0;

  // Obtener documentos con fecha de vencimiento
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: documentos, error } = await (supabase as any)
    .from('documentos')
    .select(`
      id,
      nombre,
      tipo,
      vehiculo_id,
      remolque_id,
      conductor_id,
      fecha_vencimiento
    `)
    .not('fecha_vencimiento', 'is', null);

  if (error || !documentos) {
    console.error('Error fetching documentos:', error);
    return 0;
  }

  const hoy = new Date();

  for (const doc of documentos as Array<{
    id: string;
    nombre: string;
    tipo: string;
    vehiculo_id: string | null;
    remolque_id: string | null;
    conductor_id: string | null;
    fecha_vencimiento: string | null;
  }>) {
    if (!doc.fecha_vencimiento) continue;

    const fechaVenc = new Date(doc.fecha_vencimiento);
    const diasRestantes = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

    // Solo alertar si faltan menos de 60 dias o ya vencio
    if (diasRestantes <= 60) {
      // Necesitamos el vehiculo_id para la alerta
      let vehiculoId = doc.vehiculo_id;

      // Si es documento de remolque, buscar el vehiculo asociado
      if (!vehiculoId && doc.remolque_id) {
        const { data: vehiculo } = await supabase
          .from('vehiculos')
          .select('id')
          .eq('remolque_id', doc.remolque_id)
          .single();
        vehiculoId = (vehiculo as { id: string } | null)?.id || null;
      }

      // Si es documento de conductor, buscar el vehiculo asociado
      if (!vehiculoId && doc.conductor_id) {
        const { data: vehiculo } = await supabase
          .from('vehiculos')
          .select('id')
          .eq('conductor_id', doc.conductor_id)
          .single();
        vehiculoId = (vehiculo as { id: string } | null)?.id || null;
      }

      if (vehiculoId) {
        // Verificar si ya existe alerta pendiente
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: alertaExistente } = await (supabase as any)
          .from('alertas')
          .select('id')
          .eq('vehiculo_id', vehiculoId)
          .in('tipo', ['vencimiento_documento', 'documento_vencido'])
          .eq('estado', 'pendiente')
          .eq('fecha_limite', doc.fecha_vencimiento)
          .single();

        if (!alertaExistente) {
          const prioridad = calcularPrioridad(undefined, diasRestantes);
          const tipo: TipoAlerta = diasRestantes <= 0 ? 'documento_vencido' : 'vencimiento_documento';
          const mensaje = diasRestantes <= 0
            ? `${doc.nombre} VENCIDO hace ${Math.abs(diasRestantes)} dias`
            : `${doc.nombre} vence en ${diasRestantes} dias`;

          await crearAlerta({
            vehiculo_id: vehiculoId,
            tipo,
            prioridad,
            mensaje,
            fecha_limite: doc.fecha_vencimiento,
          });

          alertasCreadas++;
        }
      }
    }
  }

  return alertasCreadas;
}

/**
 * Genera todas las alertas del sistema
 */
export async function generarTodasLasAlertas(): Promise<{ mantenimientos: number; documentos: number }> {
  const [mantenimientos, documentos] = await Promise.all([
    generarAlertasMantenimientoKm(),
    generarAlertasDocumentos(),
  ]);

  return { mantenimientos, documentos };
}
