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
  console.log('[Alertas] Obteniendo alertas pendientes...');

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
    console.error('[Alertas] Error fetching alertas:', error);
    return [];
  }

  console.log('[Alertas] Alertas encontradas:', data?.length || 0);
  return (data as AlertaConVehiculo[]) || [];
}

/**
 * Limpia alertas huérfanas (sin estado o fecha_generada)
 */
export async function limpiarAlertasHuerfanas(): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: alertasSinEstado } = await (supabase as any)
    .from('alertas')
    .select('id')
    .is('estado', null);

  if (alertasSinEstado && alertasSinEstado.length > 0) {
    const ids = alertasSinEstado.map((a: { id: string }) => a.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('alertas')
      .delete()
      .in('id', ids);
    console.log('[Alertas] Eliminadas', ids.length, 'alertas huerfanas');
    return ids.length;
  }
  return 0;
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
  const insertData = {
    ...alerta,
    estado: 'pendiente',
    fecha_generada: new Date().toISOString(),
  };

  console.log('[Alertas] Intentando crear alerta:', insertData);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('alertas')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[Alertas] Error creating alerta:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      insertData,
    });
    return null;
  }

  console.log('[Alertas] Alerta creada exitosamente:', data?.id);
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
 *
 * Logica mejorada:
 * - Para cada vehiculo y categoria con intervaloKm
 * - Busca el ULTIMO mantenimiento de esa categoria
 * - Calcula el proximo km como: km_ultimo_mantenimiento + intervalo
 * - Si no hay mantenimiento previo, calcula desde el km actual del vehiculo
 * - Genera alerta si esta dentro de 5000 km del proximo mantenimiento
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
    // Obtener TODOS los mantenimientos del vehiculo ordenados por fecha
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mantenimientos } = await (supabase as any)
      .from('mantenimientos')
      .select('categoria, kilometraje, proximo_km, fecha')
      .eq('vehiculo_id', vehiculo.id)
      .order('fecha', { ascending: false });

    const mantsArray = (mantenimientos || []) as Array<{
      categoria: string;
      kilometraje: number;
      proximo_km: number | null;
      fecha: string;
    }>;

    // Verificar cada tipo de mantenimiento con intervalo de km
    for (const catInfo of catalogoMantenimiento.filter(c => c.intervaloKm)) {
      // Buscar el ULTIMO mantenimiento de esta categoria (ya viene ordenado desc)
      const ultimoMant = mantsArray.find(m => m.categoria === catInfo.categoria);

      let proximoKm: number;

      if (ultimoMant) {
        // Si hay mantenimiento previo, usar proximo_km si existe,
        // sino calcular: km_del_mantenimiento + intervalo
        proximoKm = ultimoMant.proximo_km || (ultimoMant.kilometraje + catInfo.intervaloKm!);
      } else {
        // Sin mantenimiento previo: calcular el proximo multiplo del intervalo
        // desde el kilometraje actual del vehiculo
        // Ejemplo: km=15000, intervalo=20000 -> proximo=20000
        // Ejemplo: km=25000, intervalo=20000 -> proximo=40000
        proximoKm = Math.ceil(vehiculo.kilometraje / catInfo.intervaloKm!) * catInfo.intervaloKm!;

        // Si el calculo da exactamente el km actual, agregar un intervalo
        if (proximoKm <= vehiculo.kilometraje) {
          proximoKm += catInfo.intervaloKm!;
        }
      }

      const kmRestantes = proximoKm - vehiculo.kilometraje;

      // Solo crear alerta si estamos dentro del umbral (5000 km antes o ya paso)
      if (kmRestantes <= 5000) {
        // Verificar si ya existe una alerta pendiente para esto
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: alertaExistente } = await (supabase as any)
          .from('alertas')
          .select('id')
          .eq('vehiculo_id', vehiculo.id)
          .in('tipo', ['mantenimiento_kilometraje', 'mantenimiento_pendiente'])
          .eq('estado', 'pendiente')
          .eq('kilometraje_limite', proximoKm)
          .maybeSingle();

        if (!alertaExistente) {
          const prioridad = calcularPrioridad(kmRestantes);
          const kmFormateados = Math.abs(kmRestantes).toLocaleString('es-CO');

          let mensaje: string;
          if (kmRestantes <= 0) {
            mensaje = `${catInfo.nombre} VENCIDO - ${vehiculo.placa} (${kmFormateados} km excedido)`;
          } else if (kmRestantes <= 1000) {
            mensaje = `${catInfo.nombre} URGENTE - ${vehiculo.placa} (${kmFormateados} km restantes)`;
          } else {
            mensaje = `${catInfo.nombre} proximo - ${vehiculo.placa} (${kmFormateados} km restantes)`;
          }

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
 * Genera alertas de mantenimiento basadas en tiempo (intervaloMeses)
 *
 * Logica:
 * - Para cada vehiculo y categoria con intervaloMeses
 * - Busca el ULTIMO mantenimiento de esa categoria
 * - Calcula la proxima fecha como: fecha_ultimo_mantenimiento + intervalo_meses
 * - Si no hay mantenimiento previo, no genera alerta (necesita al menos un registro base)
 * - Genera alerta si esta dentro de 60 dias de la proxima fecha
 */
export async function generarAlertasMantenimientoTiempo(): Promise<number> {
  let alertasCreadas = 0;
  const hoy = new Date();

  // Obtener todos los vehiculos activos
  const { data: vehiculosData, error: errorVehiculos } = await supabase
    .from('vehiculos')
    .select('id, placa')
    .eq('estado', 'activo');

  if (errorVehiculos || !vehiculosData) {
    console.error('Error fetching vehiculos:', errorVehiculos);
    return 0;
  }

  const vehiculos = vehiculosData as Array<{ id: string; placa: string }>;

  for (const vehiculo of vehiculos) {
    // Obtener todos los mantenimientos del vehiculo ordenados por fecha
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mantenimientos } = await (supabase as any)
      .from('mantenimientos')
      .select('categoria, fecha, proxima_fecha')
      .eq('vehiculo_id', vehiculo.id)
      .order('fecha', { ascending: false });

    const mantsArray = (mantenimientos || []) as Array<{
      categoria: string;
      fecha: string;
      proxima_fecha: string | null;
    }>;

    // Verificar cada tipo de mantenimiento con intervalo de meses
    for (const catInfo of catalogoMantenimiento.filter(c => c.intervaloMeses)) {
      // Buscar el ULTIMO mantenimiento de esta categoria
      const ultimoMant = mantsArray.find(m => m.categoria === catInfo.categoria);

      // Si no hay mantenimiento previo, no podemos calcular cuando toca el proximo
      if (!ultimoMant) continue;

      let proximaFecha: Date;

      if (ultimoMant.proxima_fecha) {
        // Usar la fecha programada si existe
        proximaFecha = new Date(ultimoMant.proxima_fecha);
      } else {
        // Calcular: fecha_ultimo_mantenimiento + intervalo_meses
        proximaFecha = new Date(ultimoMant.fecha);
        proximaFecha.setMonth(proximaFecha.getMonth() + catInfo.intervaloMeses!);
      }

      const diasRestantes = Math.ceil((proximaFecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

      // Solo crear alerta si estamos dentro del umbral (60 dias antes o ya paso)
      if (diasRestantes <= 60) {
        const fechaLimiteStr = proximaFecha.toISOString().split('T')[0];

        // Verificar si ya existe una alerta pendiente para esto
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: alertaExistente } = await (supabase as any)
          .from('alertas')
          .select('id')
          .eq('vehiculo_id', vehiculo.id)
          .eq('tipo', 'mantenimiento_tiempo')
          .eq('estado', 'pendiente')
          .eq('fecha_limite', fechaLimiteStr)
          .maybeSingle();

        if (!alertaExistente) {
          const prioridad = calcularPrioridad(undefined, diasRestantes);

          let mensaje: string;
          if (diasRestantes <= 0) {
            mensaje = `${catInfo.nombre} VENCIDO - ${vehiculo.placa} (${Math.abs(diasRestantes)} dias excedido)`;
          } else if (diasRestantes <= 7) {
            mensaje = `${catInfo.nombre} URGENTE - ${vehiculo.placa} (${diasRestantes} dias restantes)`;
          } else {
            mensaje = `${catInfo.nombre} proximo - ${vehiculo.placa} (${diasRestantes} dias restantes)`;
          }

          await crearAlerta({
            vehiculo_id: vehiculo.id,
            tipo: 'mantenimiento_tiempo',
            prioridad,
            mensaje,
            fecha_limite: fechaLimiteStr,
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
 *
 * Logica:
 * - Busca todos los documentos con fecha de vencimiento
 * - Genera alerta si faltan 60 dias o menos (o ya vencio)
 * - Asocia la alerta al vehiculo correspondiente
 * - Incluye la placa del vehiculo en el mensaje para mejor contexto
 */
export async function generarAlertasDocumentos(): Promise<number> {
  let alertasCreadas = 0;

  // Obtener documentos con fecha de vencimiento, incluyendo info del vehiculo
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

  // Obtener todos los vehiculos para buscar placas
  const { data: vehiculosData } = await supabase
    .from('vehiculos')
    .select('id, placa, conductor_id, remolque_id');

  const vehiculosMap = new Map<string, { placa: string; conductor_id: string | null; remolque_id: string | null }>();
  for (const v of (vehiculosData || []) as Array<{ id: string; placa: string; conductor_id: string | null; remolque_id: string | null }>) {
    vehiculosMap.set(v.id, { placa: v.placa, conductor_id: v.conductor_id, remolque_id: v.remolque_id });
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
      // Determinar el vehiculo asociado
      let vehiculoId = doc.vehiculo_id;
      let placa = '';

      if (vehiculoId && vehiculosMap.has(vehiculoId)) {
        placa = vehiculosMap.get(vehiculoId)!.placa;
      }

      // Si es documento de remolque, buscar el vehiculo asociado
      if (!vehiculoId && doc.remolque_id) {
        for (const [vId, vData] of vehiculosMap) {
          if (vData.remolque_id === doc.remolque_id) {
            vehiculoId = vId;
            placa = vData.placa;
            break;
          }
        }
      }

      // Si es documento de conductor, buscar el vehiculo asociado
      if (!vehiculoId && doc.conductor_id) {
        for (const [vId, vData] of vehiculosMap) {
          if (vData.conductor_id === doc.conductor_id) {
            vehiculoId = vId;
            placa = vData.placa;
            break;
          }
        }
      }

      if (vehiculoId) {
        // Verificar si ya existe alerta pendiente para este documento especifico
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: alertaExistente } = await (supabase as any)
          .from('alertas')
          .select('id')
          .eq('vehiculo_id', vehiculoId)
          .in('tipo', ['vencimiento_documento', 'documento_vencido'])
          .eq('estado', 'pendiente')
          .eq('fecha_limite', doc.fecha_vencimiento)
          .ilike('mensaje', `%${doc.nombre}%`)
          .maybeSingle();

        if (!alertaExistente) {
          const prioridad = calcularPrioridad(undefined, diasRestantes);
          const tipo: TipoAlerta = diasRestantes <= 0 ? 'documento_vencido' : 'vencimiento_documento';

          let mensaje: string;
          const placaStr = placa ? ` - ${placa}` : '';

          if (diasRestantes <= 0) {
            mensaje = `${doc.nombre} VENCIDO${placaStr} (${Math.abs(diasRestantes)} dias excedido)`;
          } else if (diasRestantes <= 7) {
            mensaje = `${doc.nombre} URGENTE${placaStr} (${diasRestantes} dias restantes)`;
          } else {
            mensaje = `${doc.nombre} vence${placaStr} (${diasRestantes} dias restantes)`;
          }

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
 * Genera alertas de recordatorio para actualizar kilometraje
 * Se genera una alerta si han pasado 2 o mas dias desde la ultima actualizacion
 */
export async function generarAlertasActualizarKilometraje(): Promise<number> {
  let alertasCreadas = 0;

  // Obtener todos los vehiculos activos con su fecha de actualizacion de km
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: vehiculosData, error: errorVehiculos } = await (supabase as any)
    .from('vehiculos')
    .select('id, placa, marca, modelo, kilometraje, kilometraje_updated_at')
    .eq('estado', 'activo');

  if (errorVehiculos || !vehiculosData) {
    console.error('Error fetching vehiculos para recordatorio km:', errorVehiculos);
    return 0;
  }

  const vehiculos = vehiculosData as Array<{
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    kilometraje: number;
    kilometraje_updated_at: string | null;
  }>;

  const ahora = new Date();
  const dosDiasEnMs = 2 * 24 * 60 * 60 * 1000; // 2 dias en milisegundos

  for (const vehiculo of vehiculos) {
    // Si no tiene fecha de actualizacion, asumimos que necesita actualizar
    const ultimaActualizacion = vehiculo.kilometraje_updated_at
      ? new Date(vehiculo.kilometraje_updated_at)
      : new Date(0); // Fecha muy antigua si no hay registro

    const tiempoTranscurrido = ahora.getTime() - ultimaActualizacion.getTime();
    const diasTranscurridos = Math.floor(tiempoTranscurrido / (24 * 60 * 60 * 1000));

    // Solo crear alerta si han pasado 2+ dias
    if (tiempoTranscurrido >= dosDiasEnMs) {
      // Verificar si ya existe una alerta pendiente de este tipo para este vehiculo
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: alertaExistente } = await (supabase as any)
        .from('alertas')
        .select('id')
        .eq('vehiculo_id', vehiculo.id)
        .eq('tipo', 'actualizar_kilometraje')
        .eq('estado', 'pendiente')
        .maybeSingle();

      if (!alertaExistente) {
        // Calcular prioridad basada en dias sin actualizar
        let prioridad: 'alta' | 'media' | 'baja' = 'baja';
        if (diasTranscurridos >= 7) {
          prioridad = 'alta'; // Mas de una semana sin actualizar
        } else if (diasTranscurridos >= 4) {
          prioridad = 'media'; // 4-6 dias sin actualizar
        }

        const mensaje = vehiculo.kilometraje_updated_at
          ? `Actualizar kilometraje - ${vehiculo.placa} (${diasTranscurridos} dias sin actualizar)`
          : `Actualizar kilometraje - ${vehiculo.placa} (sin registro de actualizacion)`;

        await crearAlerta({
          vehiculo_id: vehiculo.id,
          tipo: 'actualizar_kilometraje',
          prioridad,
          mensaje,
          kilometraje_actual: vehiculo.kilometraje,
        });

        alertasCreadas++;
      }
    }
  }

  return alertasCreadas;
}

/**
 * Genera todas las alertas del sistema
 */
export async function generarTodasLasAlertas(): Promise<{
  mantenimientosKm: number;
  mantenimientosTiempo: number;
  documentos: number;
  kilometraje: number;
  total: number;
}> {
  console.log('[Alertas] Iniciando generacion de alertas...');

  // Primero limpiar alertas huérfanas (sin estado correcto)
  await limpiarAlertasHuerfanas();

  const [mantenimientosKm, mantenimientosTiempo, documentos, kilometraje] = await Promise.all([
    generarAlertasMantenimientoKm(),
    generarAlertasMantenimientoTiempo(),
    generarAlertasDocumentos(),
    generarAlertasActualizarKilometraje(),
  ]);

  const total = mantenimientosKm + mantenimientosTiempo + documentos + kilometraje;

  console.log('[Alertas] Generacion completada:', {
    mantenimientosKm,
    mantenimientosTiempo,
    documentos,
    kilometraje,
    total,
  });

  return { mantenimientosKm, mantenimientosTiempo, documentos, kilometraje, total };
}
