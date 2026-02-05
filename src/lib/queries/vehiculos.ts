// ============================================
// MODO MOCK - Para probar sin Supabase
// ============================================

import type { VehiculoCompleto, Vehiculo, Database } from '@/types/database';

type VehiculoInsert = Database['public']['Tables']['vehiculos']['Insert'];
type VehiculoUpdate = Database['public']['Tables']['vehiculos']['Update'];

// Datos mock para prueba
const MOCK_VEHICULOS: VehiculoCompleto[] = [
  {
    id: '1',
    placa: 'SXS-870',
    marca: 'Kenworth',
    modelo: 'T800',
    año: 2013,
    tipo: 'tractomula',
    kilometraje: 101952,
    kilometraje_updated_at: new Date().toISOString(),
    estado: 'activo',
    fecha_adquisicion: '2013-01-01',
    proxima_revision: '2024-06-01',
    vencimiento_soat: '2024-12-01',
    vencimiento_tecnomecanica: '2024-12-01',
    color: 'Blanco',
    numero_motor: 'ABC123',
    numero_chasis: 'XYZ789',
    imagen_url: null,
    notas: null,
    conductor_id: '1',
    remolque_id: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    conductores: { id: '1', nombre: 'Pedro José Corredor', cedula: '1095835275' },
    remolques: { id: '1', placa: 'R-60762' },
  },
  {
    id: '2',
    placa: 'WOL-979',
    marca: 'Kenworth',
    modelo: 'T800',
    año: 2020,
    tipo: 'tractomula',
    kilometraje: 497024,
    kilometraje_updated_at: new Date().toISOString(),
    estado: 'activo',
    fecha_adquisicion: '2020-01-01',
    proxima_revision: '2024-06-01',
    vencimiento_soat: '2024-12-01',
    vencimiento_tecnomecanica: '2024-12-01',
    color: 'Rojo',
    numero_motor: 'DEF456',
    numero_chasis: 'UVW123',
    imagen_url: null,
    notas: null,
    conductor_id: '2',
    remolque_id: '2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    conductores: { id: '2', nombre: 'Mirto Ancizar Godoy', cedula: '86041823' },
    remolques: { id: '2', placa: 'R-56731' },
  },
  {
    id: '3',
    placa: 'LWY-504',
    marca: 'Kenworth',
    modelo: 'T880',
    año: 2024,
    tipo: 'tractomula',
    kilometraje: 137999,
    kilometraje_updated_at: new Date().toISOString(),
    estado: 'activo',
    fecha_adquisicion: '2024-01-01',
    proxima_revision: '2025-01-01',
    vencimiento_soat: '2025-06-01',
    vencimiento_tecnomecanica: '2025-06-01',
    color: 'Azul',
    numero_motor: 'GHI789',
    numero_chasis: 'RST456',
    imagen_url: null,
    notas: null,
    conductor_id: '3',
    remolque_id: '3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    conductores: { id: '3', nombre: 'Oscar Darío Rangel', cedula: '13927609' },
    remolques: { id: '3', placa: 'S-67661' },
  },
  {
    id: '4',
    placa: 'SXR-716',
    marca: 'Kenworth',
    modelo: 'T800',
    año: 2012,
    tipo: 'tractomula',
    kilometraje: 1130125,
    kilometraje_updated_at: new Date().toISOString(),
    estado: 'en_mantenimiento',
    fecha_adquisicion: '2012-01-01',
    proxima_revision: '2024-03-01',
    vencimiento_soat: '2024-09-01',
    vencimiento_tecnomecanica: '2024-09-01',
    color: 'Verde',
    numero_motor: 'JKL012',
    numero_chasis: 'MNO789',
    imagen_url: null,
    notas: 'En mantenimiento preventivo',
    conductor_id: '4',
    remolque_id: '4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    conductores: { id: '4', nombre: 'Darío Vesga Sánchez', cedula: '91495998' },
    remolques: { id: '4', placa: 'S-51791' },
  },
  {
    id: '5',
    placa: 'SXS-341',
    marca: 'Kenworth',
    modelo: 'T800B',
    año: 2012,
    tipo: 'tractomula',
    kilometraje: 0,
    kilometraje_updated_at: null,
    estado: 'inactivo',
    fecha_adquisicion: '2012-01-01',
    proxima_revision: null,
    vencimiento_soat: null,
    vencimiento_tecnomecanica: null,
    color: 'Gris',
    numero_motor: 'PQR345',
    numero_chasis: 'STU678',
    imagen_url: null,
    notas: 'Vehiculo inactivo',
    conductor_id: null,
    remolque_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    conductores: null,
    remolques: null,
  },
];

// Simular delay de red (pequeño para que sea rápido)
const simulateDelay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

// Obtener todos los vehiculos con conductor y remolque
export async function getVehiculos(): Promise<VehiculoCompleto[]> {
  console.log('[MOCK] getVehiculos llamado');
  await simulateDelay(200); // Simular latencia mínima
  return [...MOCK_VEHICULOS].sort((a, b) => a.placa.localeCompare(b.placa));
}

// Obtener un vehiculo por ID
export async function getVehiculoById(id: string): Promise<VehiculoCompleto | null> {
  console.log('[MOCK] getVehiculoById llamado:', id);
  await simulateDelay(100);
  return MOCK_VEHICULOS.find(v => v.id === id) || null;
}

// Obtener estadisticas de la flota
export async function getEstadisticasFlota() {
  console.log('[MOCK] getEstadisticasFlota llamado');
  await simulateDelay(100);

  return {
    total: MOCK_VEHICULOS.length,
    activos: MOCK_VEHICULOS.filter(v => v.estado === 'activo').length,
    enMantenimiento: MOCK_VEHICULOS.filter(v => v.estado === 'en_mantenimiento').length,
    inactivos: MOCK_VEHICULOS.filter(v => v.estado === 'inactivo').length,
  };
}

// Crear un nuevo vehiculo (mock - solo simula)
export async function createVehiculo(vehiculo: VehiculoInsert): Promise<Vehiculo | null> {
  console.log('[MOCK] createVehiculo llamado:', vehiculo);
  await simulateDelay(200);

  const newVehiculo: Vehiculo = {
    id: String(Date.now()),
    ...vehiculo,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Vehiculo;

  return newVehiculo;
}

// Actualizar un vehiculo existente (mock - solo simula)
export async function updateVehiculo(id: string, updates: VehiculoUpdate): Promise<Vehiculo | null> {
  console.log('[MOCK] updateVehiculo llamado:', id, updates);
  await simulateDelay(200);

  const vehiculo = MOCK_VEHICULOS.find(v => v.id === id);
  if (!vehiculo) return null;

  return { ...vehiculo, ...updates, updated_at: new Date().toISOString() } as Vehiculo;
}

// Buscar vehiculos por placa, marca o modelo
export async function searchVehiculos(query: string): Promise<VehiculoCompleto[]> {
  console.log('[MOCK] searchVehiculos llamado:', query);

  if (!query || query.trim().length < 2) {
    return [];
  }

  await simulateDelay(100);
  const searchTerm = query.trim().toLowerCase();

  return MOCK_VEHICULOS.filter(v =>
    v.placa.toLowerCase().includes(searchTerm) ||
    v.marca.toLowerCase().includes(searchTerm) ||
    v.modelo.toLowerCase().includes(searchTerm)
  ).slice(0, 5);
}
