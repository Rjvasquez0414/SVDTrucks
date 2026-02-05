import { CategoriaMantenimiento, TipoMantenimiento } from '@/types/database';

export interface CatalogoMantenimiento {
  categoria: CategoriaMantenimiento;
  nombre: string;
  descripcion: string;
  intervaloKm?: number;
  intervaloMeses?: number;
  tipo: TipoMantenimiento;
  // Insumos tipicos para este mantenimiento
  insumosTipicos?: string[];
  // Aplica a: 'cabezote', 'trailer', 'ambos'
  aplicaA: 'cabezote' | 'trailer' | 'ambos';
}

export const catalogoMantenimiento: CatalogoMantenimiento[] = [
  // ==========================================
  // ACEITES Y FILTROS
  // ==========================================
  {
    categoria: 'cambio_aceite_motor',
    nombre: 'Cambio de Aceite Motor',
    descripcion: 'Cambio completo de aceite del motor con filtros y engrase',
    intervaloKm: 20000, // 20,000 - 24,000 km
    tipo: 'preventivo',
    aplicaA: 'cabezote',
    insumosTipicos: [
      '2 quintos Mobil 15W40',
      '3 galones 15W40 multigrado Mobil',
      '1 filtro LF-9080',
      '1 filtro FS-1040',
      '1 filtro A-23A',
      'Refrigerante Lubrestone',
      'Servicio de engrase',
    ],
  },
  {
    categoria: 'filtro_aire',
    nombre: 'Filtro de Aire',
    descripcion: 'Cambio de filtros de aire rancheros (2 unidades)',
    intervaloKm: 80000, // 80,000 - 100,000 km
    tipo: 'preventivo',
    aplicaA: 'cabezote',
    insumosTipicos: ['2 filtros de aire rancheros'],
  },
  {
    categoria: 'filtro_agua',
    nombre: 'Filtro de Agua',
    descripcion: 'Cambio del filtro de agua del sistema de refrigeracion',
    intervaloKm: 60000,
    tipo: 'preventivo',
    aplicaA: 'cabezote',
    insumosTipicos: ['1 filtro de agua'],
  },
  {
    categoria: 'filtro_trampa_acpm',
    nombre: 'Filtro Trampa ACPM',
    descripcion: 'Cambio del filtro trampa de combustible ACPM',
    intervaloKm: 40000,
    tipo: 'preventivo',
    aplicaA: 'cabezote',
    insumosTipicos: ['1 filtro trampa ACPM'],
  },
  {
    categoria: 'valvulina_transmision',
    nombre: 'Valvulina de Transmision',
    descripcion: 'Cambio de valvulina Mobil 85W140 sintetica de la transmision',
    intervaloKm: 200000,
    tipo: 'preventivo',
    aplicaA: 'cabezote',
    insumosTipicos: ['Valvulina Mobil 85W140 sintetica'],
  },
  {
    categoria: 'aceite_caja_cambios',
    nombre: 'Aceite Caja de Cambios',
    descripcion: 'Cambio de aceite Chevron sintetico Transfluid 50 de la caja de cambios',
    intervaloKm: 250000,
    tipo: 'preventivo',
    aplicaA: 'cabezote',
    insumosTipicos: ['Aceite Chevron sintetico Transfluid 50'],
  },

  // ==========================================
  // LLANTAS
  // ==========================================
  {
    categoria: 'alineacion',
    nombre: 'Alineacion',
    descripcion: 'Alineacion de la direccion del vehiculo',
    intervaloKm: 40000,
    tipo: 'preventivo',
    aplicaA: 'cabezote',
  },
  {
    categoria: 'rotacion_llantas',
    nombre: 'Rotacion de Llantas',
    descripcion: 'Rotacion llanta a llanta en la misma pacha',
    intervaloMeses: 4, // A los 4 meses de haberlas puesto
    tipo: 'preventivo',
    aplicaA: 'ambos',
  },
  {
    categoria: 'cambio_llantas_direccionales',
    nombre: 'Cambio Llantas Direccionales',
    descripcion: 'Cambio de las 2 llantas direccionales del cabezote',
    intervaloKm: 95000,
    tipo: 'preventivo',
    aplicaA: 'cabezote',
    insumosTipicos: ['2 llantas direccionales'],
  },
  {
    categoria: 'cambio_llantas_traccion',
    nombre: 'Cambio Llantas Traccion',
    descripcion: 'Cambio de las 8 llantas de traccion del cabezote (4 pachas)',
    tipo: 'preventivo',
    aplicaA: 'cabezote',
    insumosTipicos: ['8 llantas de traccion'],
  },
  {
    categoria: 'cambio_llantas_trailer',
    nombre: 'Cambio Llantas Trailer',
    descripcion: 'Cambio de las 12 llantas del trailer (6 pachas)',
    intervaloMeses: 12, // 1 vez al año
    tipo: 'preventivo',
    aplicaA: 'trailer',
    insumosTipicos: ['12 llantas de trailer'],
  },

  // ==========================================
  // SUSPENSION
  // ==========================================
  {
    categoria: 'bujes_cabezote',
    nombre: 'Bujes del Cabezote',
    descripcion: 'Cambio de bujes del sistema de suspension del cabezote',
    intervaloKm: 60000,
    intervaloMeses: 10, // 10-11 meses
    tipo: 'preventivo',
    aplicaA: 'cabezote',
    insumosTipicos: ['Juego de bujes cabezote'],
  },
  {
    categoria: 'bujes_trailer',
    nombre: 'Bujes, Retenedores y Rodillos Trailer',
    descripcion: 'Cambio de bujes, retenedores y rodillos (internos y externos) del trailer',
    intervaloMeses: 6, // 6-7 meses
    tipo: 'preventivo',
    aplicaA: 'trailer',
    insumosTipicos: [
      'Juego de bujes trailer',
      'Retenedores',
      'Rodillos internos',
      'Rodillos externos',
    ],
  },

  // ==========================================
  // FRENOS
  // ==========================================
  {
    categoria: 'revision_frenos',
    nombre: 'Revision Bandas de Frenado',
    descripcion: 'Revision de bandas del sistema de frenos de tambor neumatico',
    intervaloKm: 60000,
    tipo: 'preventivo',
    aplicaA: 'ambos',
  },

  // ==========================================
  // MOTOR (Reparaciones mayores)
  // ==========================================
  {
    categoria: 'reparacion_parcial_motor',
    nombre: 'Reparacion Parcial de Motor',
    descripcion: 'Reparacion parcial del motor Cummins (ISX 400 / X15)',
    intervaloKm: 500000,
    tipo: 'correctivo',
    aplicaA: 'cabezote',
  },
  {
    categoria: 'reparacion_total_motor',
    nombre: 'Reparacion Total de Motor',
    descripcion: 'Reparacion total del motor Cummins (ISX 400 / X15)',
    intervaloKm: 1000000,
    tipo: 'correctivo',
    aplicaA: 'cabezote',
  },

  // ==========================================
  // TRAILER ESPECIFICO
  // ==========================================
  {
    categoria: 'quinta_rueda',
    nombre: 'Mantenimiento Quinta Rueda',
    descripcion: 'Mantenimiento de la tornamesa/quinta rueda - depende del desgaste',
    tipo: 'correctivo',
    aplicaA: 'cabezote',
  },
  {
    categoria: 'manhole',
    nombre: 'Cambio Sello Manhole',
    descripcion: 'Cambio del sello del manhole - depende de cantidad de cargues',
    tipo: 'correctivo',
    aplicaA: 'trailer',
    insumosTipicos: ['Sello de manhole'],
  },
  {
    categoria: 'conexiones_trailer',
    nombre: 'Conexiones del Trailer',
    descripcion: 'Revision/cambio de manos (conexiones aire-luz-aire) del trailer',
    tipo: 'correctivo',
    aplicaA: 'ambos',
    insumosTipicos: ['Mangueras de aire', 'Conectores electricos'],
  },

  // ==========================================
  // OTROS
  // ==========================================
  {
    categoria: 'sistema_electrico',
    nombre: 'Sistema Electrico',
    descripcion: 'Reparacion de componentes del sistema electrico',
    tipo: 'correctivo',
    aplicaA: 'ambos',
  },
  {
    categoria: 'otro',
    nombre: 'Otro',
    descripcion: 'Otros tipos de mantenimiento o reparacion',
    tipo: 'correctivo',
    aplicaA: 'ambos',
  },
  // Duplicado de "otro" para mantenimientos preventivos
  {
    categoria: 'otro',
    nombre: 'Otro',
    descripcion: 'Otros tipos de mantenimiento preventivo',
    tipo: 'preventivo',
    aplicaA: 'ambos',
  },
];

export function getCategoriaInfo(categoria: CategoriaMantenimiento): CatalogoMantenimiento | undefined {
  return catalogoMantenimiento.find((c) => c.categoria === categoria);
}

export function getCategoriasPreventivas(): CatalogoMantenimiento[] {
  return catalogoMantenimiento.filter((c) => c.tipo === 'preventivo');
}

export function getCategoriasCorrectivas(): CatalogoMantenimiento[] {
  return catalogoMantenimiento.filter((c) => c.tipo === 'correctivo');
}

export function getCategoriasPorAplicacion(aplicaA: 'cabezote' | 'trailer' | 'ambos'): CatalogoMantenimiento[] {
  return catalogoMantenimiento.filter((c) => c.aplicaA === aplicaA || c.aplicaA === 'ambos');
}

// Calcular proximo mantenimiento basado en kilometraje actual
export function calcularProximoKm(categoria: CategoriaMantenimiento, kmActual: number): number | null {
  const info = getCategoriaInfo(categoria);
  if (!info?.intervaloKm) return null;

  // Calcular siguiente multiplo del intervalo
  const siguienteMultiplo = Math.ceil(kmActual / info.intervaloKm) * info.intervaloKm;
  return siguienteMultiplo;
}

// Calcular proxima fecha basada en intervalo de meses
export function calcularProximaFecha(categoria: CategoriaMantenimiento, fechaUltimo?: string): Date | null {
  const info = getCategoriaInfo(categoria);
  if (!info?.intervaloMeses) return null;

  const fechaBase = fechaUltimo ? new Date(fechaUltimo) : new Date();
  const proximaFecha = new Date(fechaBase);
  proximaFecha.setMonth(proximaFecha.getMonth() + info.intervaloMeses);
  return proximaFecha;
}
